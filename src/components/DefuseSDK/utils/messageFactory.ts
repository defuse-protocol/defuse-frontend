import { poaBridge } from "@defuse-protocol/internal-utils"
import { sha256 } from "@noble/hashes/sha256"
import { base64 } from "@scure/base"
import { getAddress } from "viem"
import { config } from "../config"
import { logger } from "../logger"
import type { SupportedChainName } from "../types/base"
import type {
  Intent,
  Nep413DefuseMessageFor_DefuseIntents,
} from "../types/defuse-contracts-types"
import type { IntentsUserId } from "../types/intentsUserId"
import type { WalletMessage } from "../types/walletMessage"
import { assert } from "./assert"
import { buildHotOmniWithdrawIntent } from "./hotOmniUtils"

/**
 * @param tokenDeltas
 * @param signerId
 * @param deadlineTimestamp Unix timestamp in milliseconds
 * @param referral
 * @param memo
 * @param appFee
 * @param appFeeRecipient
 */
export function makeInnerSwapMessage({
  tokenDeltas,
  signerId,
  deadlineTimestamp,
  referral,
  memo,
  appFee,
  appFeeRecipient,
}: {
  tokenDeltas: [string, bigint][]
  signerId: IntentsUserId
  deadlineTimestamp: number
  referral?: string
  memo?: string
  appFee: [string, bigint][]
  appFeeRecipient: string
}): Nep413DefuseMessageFor_DefuseIntents {
  const tokenDiff: Record<string, string> = {}
  const tokenDiffNum: Record<string, bigint> = {}

  for (const [token, amount] of tokenDeltas) {
    tokenDiffNum[token] ??= 0n
    tokenDiffNum[token] += amount
    // biome-ignore lint/style/noNonNullAssertion: it is checked above
    tokenDiff[token] = tokenDiffNum[token]!.toString()
  }

  if (Object.keys(tokenDiff).length === 0) {
    logger.warn("Empty diff")
    return {
      deadline: new Date(deadlineTimestamp).toISOString(),
      intents: [],
      signer_id: signerId,
    }
  }

  const intents: Intent[] = [
    {
      intent: "token_diff",
      diff: tokenDiff,
      referral,
      memo,
    },
  ]

  if (appFee.length) {
    intents.push({
      intent: "transfer",
      tokens: Object.fromEntries(
        appFee.map(([token, amount]) => [token, amount.toString()])
      ),
      receiver_id: appFeeRecipient,
      memo: "APP_FEE",
    })
  }

  return {
    deadline: new Date(deadlineTimestamp).toISOString(),
    intents,
    signer_id: signerId,
  }
}

/**
 * Explanation of `tokenDelta` and `storageTokenDelta`.
 *
 * Say we withdraw token $Y, but we have token $X. We need to swap $X to $Y first.
 * `tokenDelta` represents the swap from $X to $Y.
 *
 * Say we withdraw token $Y to Near, and we need to pay for storage.
 * Storage is paid in token $N.
 * `storageTokenDelta` represents the swap from $Y to $N.
 *
 * Important: We must execute these swaps separately rather than combining them.
 * This is because protocol fees are applied to each outgoing token in a swap.
 *
 * Example of why combining swaps fails when fee is 0.3%:
 *
 * User withdraws 1.0 USDC:eth to Near blockchain and pays for storage.
 * Quote #1: 1.0 USDC:eth -> 0.994009 USDC:near
 * Quote #2: 0.003866 USDC:near -> 0.00125 NEAR
 *
 * User combined diff: [-1000000 USDC:eth, +994009-3866=+990143 USDC:near, +125000 NEAR]
 *   - Shared pool state: [+997000 USDC:eth, -990143 USDC:near, -125000 NEAR]
 *   - Note: 1000000*0.003=3000 USDC:eth taken as protocol fee
 *
 * Solver #1 diff: [+997000 USDC:eth, -997000 USDC:near, 0 NEAR]
 *   - Shared pool state: [+997000-997000=0 USDC:eth, -990143+994009=+3866 USDC:near, -125000 NEAR]
 *
 * Solver #2 diff: [0 USDC:eth, +3854 USDC:near, -125377 NEAR]
 *  - Shared pool state: [0 USDC:eth, +3866-3854=12 USDC:near, -125000+125000=0 NEAR]
 *
 * Result: 12 USDC:near remains in the pool - violating the invariant that at the end the pool should be empty.
 *
 * By executing swaps separately, we properly account for protocol fees at each step.
 *
 * @param tokenDeltas - the swap from X to Y, where Y to be withdrawn
 * @param storageTokenDeltas - the swap from Y to N, where Y to be withdrawn, N to be paid for storage
 * @param withdrawParams
 * @param signerId
 * @param deadlineTimestamp - unix timestamp in seconds
 * @param referral
 */
export function makeInnerSwapAndWithdrawMessage({
  tokenDeltas,
  storageTokenDeltas,
  withdrawParams,
  signerId,
  deadlineTimestamp,
  referral,
}: {
  tokenDeltas: [string, bigint][]
  storageTokenDeltas: [string, bigint][]
  withdrawParams: WithdrawParams
  signerId: IntentsUserId
  deadlineTimestamp: number
  referral?: string
}): Nep413DefuseMessageFor_DefuseIntents {
  const intents: NonNullable<Nep413DefuseMessageFor_DefuseIntents["intents"]> =
    []

  if (tokenDeltas.length) {
    const { intents: swapIntents } = makeInnerSwapMessage({
      tokenDeltas,
      signerId,
      deadlineTimestamp,
      referral,
      appFee: [],
      appFeeRecipient: "",
    })
    assert(swapIntents, "swapIntents must be defined")
    intents.push(...swapIntents)
  }

  if (storageTokenDeltas.length) {
    const { intents: storageIntents } = makeInnerSwapMessage({
      tokenDeltas: storageTokenDeltas,
      signerId,
      deadlineTimestamp,
      referral,
      appFee: [],
      appFeeRecipient: "",
    })
    assert(storageIntents, "storageIntents must be defined")
    intents.push(...storageIntents)
  }

  intents.push(makeInnerWithdrawMessage(withdrawParams))

  return {
    deadline: new Date(deadlineTimestamp).toISOString(),
    intents: intents,
    signer_id: signerId,
  }
}

export type WithdrawParams =
  | {
      type: "to_near"
      amount: bigint
      tokenAccountId: string
      receiverId: string
      storageDeposit: bigint
    }
  | {
      type: "via_poa_bridge"
      amount: bigint
      tokenAccountId: string
      destinationAddress: string
      destinationMemo: string | null
    }
  | {
      type: "to_aurora_engine"
      amount: bigint
      tokenAccountId: string
      auroraEngineContractId: string
      destinationAddress: string
    }
  | {
      type: "hot_omni"
      chainName: SupportedChainName
      amount: bigint
      defuseAssetId: string
      destinationAddress: string // todo: consider renaming `receiverId` and `destinationAddress` to `recipient`?
    }

function makeInnerWithdrawMessage(params: WithdrawParams): Intent {
  const paramsType = params.type
  switch (paramsType) {
    case "to_near":
      if (params.tokenAccountId === "wrap.near") {
        return {
          intent: "native_withdraw",
          receiver_id: params.receiverId,
          amount: params.amount.toString(),
        }
      }
      return {
        intent: "ft_withdraw",
        token: params.tokenAccountId,
        receiver_id: params.receiverId,
        amount: params.amount.toString(),
        storage_deposit:
          params.storageDeposit > 0n ? params.storageDeposit.toString() : null,
      }

    case "via_poa_bridge": {
      return {
        intent: "ft_withdraw",
        token: params.tokenAccountId,
        receiver_id: params.tokenAccountId,
        amount: params.amount.toString(),
        memo: poaBridge.createWithdrawMemo({
          receiverAddress: params.destinationAddress,
          xrpMemo: params.destinationMemo,
        }),
      }
    }

    case "to_aurora_engine":
      return {
        intent: "ft_withdraw",
        token: params.tokenAccountId,
        receiver_id: params.auroraEngineContractId,
        amount: params.amount.toString(),
        msg: makeAuroraEngineDepositMsg(params.destinationAddress),
      }

    case "hot_omni": {
      return buildHotOmniWithdrawIntent({
        chainName: params.chainName,
        defuseAssetId: params.defuseAssetId,
        amount: params.amount,
        receiver: params.destinationAddress,
      })
    }

    default:
      paramsType satisfies never
      throw new Error(`Unknown withdraw type: ${paramsType}`)
  }
}

export function makeSwapMessage({
  innerMessage,
  nonce = randomDefuseNonce(),
}: {
  innerMessage: Nep413DefuseMessageFor_DefuseIntents
  nonce?: Uint8Array
}): WalletMessage {
  const payload = {
    signer_id: innerMessage.signer_id,
    verifying_contract: config.env.contractID,
    deadline: innerMessage.deadline,
    nonce: base64.encode(nonce),
    intents: innerMessage.intents,
  }
  const payloadSerialized = JSON.stringify(payload)
  const payloadBytes = new TextEncoder().encode(payloadSerialized)

  return {
    NEP413: {
      message: JSON.stringify(innerMessage),
      // This is who will be verifying the message
      recipient: config.env.contractID,
      nonce,
    },
    ERC191: {
      message: JSON.stringify(payload, null, 2),
    },
    SOLANA: {
      message: payloadBytes,
    },
    WEBAUTHN: {
      challenge: makeChallenge(payloadBytes),
      payload: payloadSerialized,
      parsedPayload: payload,
    },
    TON_CONNECT: {
      message: {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    },
    STELLAR: {
      message: JSON.stringify(payload, null, 2),
    },
  }
}

export function makeEmptyMessage({
  signerId,
  deadlineTimestamp,
  nonce = randomDefuseNonce(),
}: {
  signerId: IntentsUserId
  deadlineTimestamp: number
  nonce?: Uint8Array
}): WalletMessage {
  const innerMessage: Nep413DefuseMessageFor_DefuseIntents = {
    deadline: new Date(deadlineTimestamp).toISOString(),
    intents: [],
    signer_id: signerId,
  }

  return makeSwapMessage({
    innerMessage,
    nonce,
  })
}

export function randomDefuseNonce(): Uint8Array {
  return randomBytes(32)
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length))
}

/**
 * In order to deposit to AuroraEngine powered chain, we need to have a `msg`
 * with the destination address in special format (lower case + without 0x).
 */
function makeAuroraEngineDepositMsg(recipientAddress: string): string {
  const parsedRecipientAddress = getAddress(recipientAddress)
  return parsedRecipientAddress.slice(2).toLowerCase()
}

/**
 * Converts UTF-8 string to bytes for WebAuthn challenge
 */
export function makeChallenge(payload: Uint8Array): Uint8Array {
  // It's possible to use native crypto, but it's async, and this would break existing flow:
  // await crypto.subtle.digest("SHA-256", messageBytes)
  const hash = sha256(payload)
  return new Uint8Array(hash)
}

export function makeInnerTransferMessage({
  tokenDeltas,
  signerId,
  deadlineTimestamp,
  receiverId,
  memo,
}: {
  tokenDeltas: [string, bigint][]
  signerId: IntentsUserId
  deadlineTimestamp: number
  receiverId: string
  memo?: string
}): Nep413DefuseMessageFor_DefuseIntents {
  const tokens: Record<string, string> = {}
  const seenTokens = new Set<string>()

  for (const [token, amount] of tokenDeltas) {
    assert(!seenTokens.has(token), `Duplicate token found: ${token}`)
    seenTokens.add(token)
    assert(
      amount > 0n,
      `Transfer amount must be positive, got: ${amount} for token ${token}`
    )
    tokens[token] = amount.toString()
  }

  return {
    deadline: new Date(deadlineTimestamp).toISOString(),
    intents: [
      {
        intent: "transfer",
        tokens,
        receiver_id: receiverId,
        ...(memo ? { memo } : {}),
      },
    ],
    signer_id: signerId,
  }
}
