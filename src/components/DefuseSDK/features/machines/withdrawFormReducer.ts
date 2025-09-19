import {
  getChainFromDid,
  resolveTokenByDid,
} from "@src/components/DefuseSDK/utils/tokenDeployment"
import {
  type TokenFamilyList,
  resolveTokenFamily,
} from "@src/components/DefuseSDK/utils/tokenFamily"
import { getAnyBaseTokenInfo } from "@src/components/DefuseSDK/utils/tokenUtils"
import { LIST_TOKENS_FLATTEN, tokenFamilies } from "@src/constants/tokens"
import { type ActorRef, type Snapshot, fromTransition } from "xstate"
import type {
  BaseTokenInfo,
  SupportedChainName,
  TokenInfo,
  TokenValue,
} from "../../types/base"
import { assert } from "../../utils/assert"
import { isBaseToken } from "../../utils/token"
import { validateAddress } from "../../utils/validateAddress"
import { isNearIntentsNetwork } from "../withdraw/components/WithdrawForm/utils"
import { isCexIncompatible } from "../withdraw/utils/cexCompatibility"
import {
  getHyperliquidSrcChain,
  isHyperliquid,
} from "../withdraw/utils/hyperliquid"

export type Fields = Array<Exclude<keyof State, "parentRef">>
const fields: Fields = [
  "tokenIn",
  "tokenOut",
  "parsedAmount",
  "parsedRecipient",
  "parsedDestinationMemo",
  "cexFundsLooseConfirmation",
]

export type ParentEvents = {
  type: "WITHDRAW_FORM_FIELDS_CHANGED"
  fields: Fields
}

type ParentActor = ActorRef<Snapshot<unknown>, ParentEvents>

type CexFundsLooseConfirmationStatus =
  | "confirmed"
  | "not_confirmed"
  | "not_required"

export type Events =
  | {
      type: "WITHDRAW_FORM.UPDATE_TOKEN"
      params: {
        token: TokenInfo
        /**
         * It's important to provide `parsedAmount` here, because the actual amount is
         * different because of the decimals. We cannot parse it here, because we don't
         * know what format UI uses to display the amount.
         */
        parsedAmount: TokenValue | null
      }
    }
  | {
      type: "WITHDRAW_FORM.UPDATE_BLOCKCHAIN"
      params: {
        blockchain: SupportedChainName | "near_intents"
        /**
         * Don't need to provide `parsedAmount` here, because amount is not
         * expected to change when blockchain changes, because decimals for
         * a token are the same across all blockchains.
         */
      }
    }
  | {
      type: "WITHDRAW_FORM.UPDATE_AMOUNT"
      params: {
        amount: string
        parsedAmount: TokenValue | null
      }
    }
  | {
      type: "WITHDRAW_FORM.RECIPIENT"
      params: {
        recipient: string
        /** Hyperliquid withdrawals happen on base token network to the provided proxy recipient address. */
        proxyRecipient: string | null
      }
    }
  | {
      type: "WITHDRAW_FORM.UPDATE_DESTINATION_MEMO"
      params: {
        destinationMemo: string
      }
    }
  | {
      type: "WITHDRAW_FORM.CEX_FUNDS_LOOSE_CHANGED"
      params: {
        cexFundsLooseConfirmation: CexFundsLooseConfirmationStatus
      }
    }
  | {
      type: "WITHDRAW_FORM.UPDATE_MIN_RECEIVED_AMOUNT"
      params: {
        minReceivedAmount: TokenValue | null
      }
    }

export type State = {
  parentRef: ParentActor
  tokenIn: TokenInfo
  tokenOut: BaseTokenInfo
  amount: string
  parsedAmount: TokenValue | null
  recipient: string
  parsedRecipient: string | null
  destinationMemo: string
  parsedDestinationMemo: string | null
  cexFundsLooseConfirmation: CexFundsLooseConfirmationStatus
  minReceivedAmount: TokenValue | null
  blockchain: SupportedChainName | "near_intents"
}

export const withdrawFormReducer = fromTransition(
  (state, event: Events) => {
    let newState = state
    const eventType = event.type
    switch (eventType) {
      case "WITHDRAW_FORM.UPDATE_TOKEN": {
        const tokenOut = getBaseTokenInfoWithFallback(
          event.params.token,
          state.tokenOut.chainName
        )
        newState = {
          ...state,
          parsedAmount: event.params.parsedAmount,
          tokenIn: event.params.token,
          tokenOut,
          recipient: "",
          parsedRecipient: null,
          destinationMemo: "",
          parsedDestinationMemo: null,
          cexFundsLooseConfirmation:
            cexFundsLooseConfirmationStatusDefault(tokenOut),
          minReceivedAmount: null,
          blockchain: tokenOut.chainName,
        }
        break
      }
      case "WITHDRAW_FORM.UPDATE_BLOCKCHAIN": {
        const blockchain = event.params.blockchain

        const tokenOut = resolveTokenOut(
          blockchain,
          state.tokenIn,
          tokenFamilies,
          LIST_TOKENS_FLATTEN
        )

        const cexFundsLooseConfirmation = isNearIntentsNetwork(blockchain)
          ? "not_required"
          : cexFundsLooseConfirmationStatusDefault(tokenOut)

        newState = {
          ...state,
          tokenOut,
          recipient: "",
          parsedRecipient: null,
          destinationMemo: "",
          parsedDestinationMemo: null,
          cexFundsLooseConfirmation,
          minReceivedAmount: null,
          blockchain,
        }
        break
      }
      case "WITHDRAW_FORM.UPDATE_AMOUNT": {
        newState = {
          ...state,
          parsedAmount: event.params.parsedAmount,
          amount: event.params.amount,
        }
        break
      }
      case "WITHDRAW_FORM.RECIPIENT": {
        const recipient = event.params.recipient
        const determinedRecipient = isHyperliquid(state.blockchain)
          ? event.params.proxyRecipient
          : event.params.recipient

        assert(determinedRecipient, "Recipient is required")
        const parsedRecipient = getParsedRecipient(
          determinedRecipient,
          state.tokenOut,
          isNearIntentsNetwork(state.blockchain)
        )

        newState = {
          ...state,
          recipient,
          parsedRecipient,
        }
        break
      }
      case "WITHDRAW_FORM.UPDATE_DESTINATION_MEMO": {
        newState = {
          ...state,
          destinationMemo: event.params.destinationMemo,
          parsedDestinationMemo: parseDestinationMemo(
            event.params.destinationMemo,
            state.tokenOut.chainName
          ),
        }
        break
      }
      case "WITHDRAW_FORM.CEX_FUNDS_LOOSE_CHANGED": {
        newState = {
          ...state,
          cexFundsLooseConfirmation: event.params.cexFundsLooseConfirmation,
        }
        break
      }
      case "WITHDRAW_FORM.UPDATE_MIN_RECEIVED_AMOUNT": {
        newState = {
          ...state,
          minReceivedAmount: event.params.minReceivedAmount,
        }
        break
      }
      default: {
        event satisfies never
        return state
      }
    }

    const changedFields: Fields = []
    for (const key of fields) {
      if (newState[key] !== state[key]) {
        changedFields.push(key)
      }
    }
    if (changedFields.length > 0) {
      state.parentRef.send({
        type: "WITHDRAW_FORM_FIELDS_CHANGED",
        fields: changedFields,
      })
    }

    return newState
  },
  ({
    input,
  }: {
    input: {
      parentRef: ParentActor
      tokenIn: TokenInfo
    }
  }): State => {
    const tokenOut = getBaseTokenInfoWithFallback(input.tokenIn, null)

    return {
      parentRef: input.parentRef,
      tokenIn: input.tokenIn,
      tokenOut,
      amount: "",
      parsedAmount: null,
      recipient: "",
      parsedRecipient: null,
      destinationMemo: "",
      parsedDestinationMemo: null,
      cexFundsLooseConfirmation:
        cexFundsLooseConfirmationStatusDefault(tokenOut),
      minReceivedAmount: null,
      blockchain: tokenOut.chainName,
    }
  }
)

export function getBaseTokenInfoWithFallback(
  tokenIn: TokenInfo,
  chainName: string | null
): BaseTokenInfo {
  if (isBaseToken(tokenIn)) {
    return tokenIn
  }

  if (chainName != null) {
    const tokenOut = tokenIn.groupedTokens.find(
      (token) => token.chainName === chainName
    )
    if (tokenOut != null) {
      return tokenOut
    }
  }

  const tokenOut = tokenIn.groupedTokens[0]
  assert(tokenOut != null, "Token out not found")
  return tokenOut
}

/**
 * @note normalizedRecipient - normalize in case EVM-like account
 */
function getParsedRecipient(
  recipient: string,
  tokenOut: BaseTokenInfo,
  isNearIntentsNetwork: boolean
): string | null {
  if (isNearIntentsNetwork) {
    const normalizedRecipient = recipient.toLowerCase()
    return validateAddress(normalizedRecipient, "near")
      ? normalizedRecipient
      : null
  }

  if (tokenOut.chainName === "near") {
    const normalizedRecipient = recipient.toLowerCase()
    return validateAddress(normalizedRecipient, "near")
      ? normalizedRecipient
      : null
  }

  return validateAddress(recipient, tokenOut.chainName) ? recipient : null
}

export function parseDestinationMemo(
  memo: string,
  chainName: SupportedChainName
): string | null {
  if (chainName !== "xrpledger") return null
  if (memo.trim() === "") return null

  const num = Number(memo.trim())
  if (!Number.isInteger(num) || num < 0 || num > 4294967295) return null

  return num.toString()
}

function cexFundsLooseConfirmationStatusDefault(
  tokenOut: BaseTokenInfo
): CexFundsLooseConfirmationStatus {
  return isCexIncompatible(tokenOut) ? "not_confirmed" : "not_required"
}

export function resolveTokenOut(
  blockchain: SupportedChainName | "near_intents",
  tokenIn: TokenInfo,
  tokenFamilies: TokenFamilyList,
  tokenList: TokenInfo[]
): BaseTokenInfo {
  if (isNearIntentsNetwork(blockchain)) {
    // Doesn't matter we use, because we won't use it anyway for internal transfers
    return getAnyBaseTokenInfo(tokenIn)
  }

  if (isHyperliquid(blockchain)) {
    // biome-ignore lint/style/noParameterAssign: we substitute "hyperliquid" with the actual chain, where we will be doing transfers to.
    blockchain = (
      {
        bitcoin: "bitcoin",
        solana: "solana",
        ethereum: "eth",
      } as const
    )[getHyperliquidSrcChain(tokenIn)]
  }

  const tf = resolveTokenFamily(tokenFamilies, tokenIn)
  assert(tf != null, "Token family not found")

  const tokenDid = tf.deployments.find(
    (did) => getChainFromDid(did) === blockchain
  )
  assert(tokenDid != null, "Token deployment not found")

  const tokenOut = resolveTokenByDid(tokenList, tokenDid)
  assert(tokenOut != null, "Token out not found")

  return tokenOut
}
