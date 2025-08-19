import type { BlockchainEnum } from "@defuse-protocol/internal-utils"
import { reverseAssetNetworkAdapter } from "@src/components/DefuseSDK/utils/adapters"
import { assert } from "@src/components/DefuseSDK/utils/assert"
import { parseUnits } from "@src/components/DefuseSDK/utils/parse"
import { getDerivedToken } from "@src/components/DefuseSDK/utils/tokenUtils"
import { type ActorRef, type Snapshot, fromTransition } from "xstate"
import type {
  BaseTokenInfo,
  SupportedChainName,
  UnifiedTokenInfo,
} from "../../types/base"
import type { SwappableToken } from "../../types/swap"
import { isBaseToken, isUnifiedToken } from "../../utils"

export type Fields = Array<Exclude<keyof State, "parentRef">>
const fields: Fields = ["token", "blockchain", "parsedAmount", "amount"]

export type ParentEvents = {
  type: "DEPOSIT_FORM_FIELDS_CHANGED"
  fields: Fields
}
type ParentActor = ActorRef<Snapshot<unknown>, ParentEvents>

export type Events =
  | {
      type: "DEPOSIT_FORM.UPDATE_TOKEN"
      params: {
        token: BaseTokenInfo | UnifiedTokenInfo
      }
    }
  | {
      type: "DEPOSIT_FORM.UPDATE_BLOCKCHAIN"
      params: {
        network: BlockchainEnum | null
      }
    }
  | {
      type: "DEPOSIT_FORM.UPDATE_AMOUNT"
      params: {
        amount: string
      }
    }

export type State = {
  parentRef: ParentActor
  token: BaseTokenInfo | UnifiedTokenInfo | null
  derivedToken: BaseTokenInfo | null
  blockchain: SupportedChainName | null
  parsedAmount: bigint | null
  amount: string
}

export const depositFormReducer = fromTransition(
  (state, event: Events) => {
    let newState = state
    const eventType = event.type
    switch (eventType) {
      case "DEPOSIT_FORM.UPDATE_TOKEN": {
        newState = {
          ...state,
          token: event.params.token,
          derivedToken: null,
          blockchain: null,
          parsedAmount: null,
          amount: "",
        }
        break
      }
      case "DEPOSIT_FORM.UPDATE_BLOCKCHAIN": {
        if (event.params.network == null || state.token == null) {
          newState = {
            ...state,
            blockchain: null,
            derivedToken: null,
            parsedAmount: null,
            amount: "",
          }
          break
        }
        const blockchain = reverseAssetNetworkAdapter[event.params.network]
        const derivedToken = getDerivedToken(state.token, blockchain)
        // This isn't possible assertion, if this happens then we need to check the token list
        assert(derivedToken != null, "Token not found")
        newState = {
          ...state,
          blockchain,
          derivedToken,
          parsedAmount: null,
          amount: "",
        }
        break
      }
      case "DEPOSIT_FORM.UPDATE_AMOUNT": {
        const token = state.derivedToken
        // Use catch to prevent invalid amount as not numberish string from stopping the deposit UI machine
        try {
          assert(token != null, "Token not found")
          const amount = event.params.amount

          const parsedAmount = amount
            ? parseUnits(amount, token.decimals)
            : null
          newState = {
            ...state,
            parsedAmount,
            amount,
          }
        } catch {
          newState = {
            ...state,
            parsedAmount: null,
            amount: "",
          }
        }
        break
      }
      default:
        event satisfies never
        return state
    }

    const changedFields: Fields = []
    for (const key of fields) {
      if (newState[key] !== state[key]) {
        changedFields.push(key)
      }
    }
    if (changedFields.length > 0) {
      state.parentRef.send({
        type: "DEPOSIT_FORM_FIELDS_CHANGED",
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
      token: SwappableToken
    }
  }): State => {
    let blockchain = null
    if (!isUnifiedToken(input.token)) {
      blockchain = isBaseToken(input.token) ? input.token.chainName : null
    }
    const derivedToken =
      input.token && blockchain
        ? getDerivedToken(input.token, blockchain)
        : null

    return {
      parentRef: input.parentRef,
      token: input.token,
      derivedToken,
      blockchain,
      parsedAmount: null,
      amount: "",
    }
  }
)
