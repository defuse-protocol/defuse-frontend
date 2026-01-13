import {
  messageFactory,
  type walletMessage,
} from "@defuse-protocol/internal-utils"
import type { IntentsUserId } from "../types/intentsUserId"
import type { SignerCredentials } from "./formatters"
import { formatUserIdentity } from "./formatters"

export interface IntentMessageConfig {
  /**
   * User identifier either as DefuseUserId or SignerCredentials
   * If SignerCredentials is provided, it will be converted to DefuseUserId
   */
  signerId: IntentsUserId | SignerCredentials
  /**
   * Optional deadline timestamp in milliseconds
   * @default 5 minutes from now
   */
  deadlineTimestamp?: number
  /**
   * Optional nonce for tracking
   * @default random nonce
   */
  nonce?: Uint8Array
  /**
   * Optional referral code for tracking
   */
  referral?: string
  /**
   * Optional message to attach to the intent
   */
  memo?: string
}

function resolveSignerId(
  signerId: IntentsUserId | SignerCredentials
): IntentsUserId {
  return typeof signerId === "string" ? signerId : formatUserIdentity(signerId)
}

/**
 * Creates an intent message for token swaps
 * @param swapConfig Array of [tokenAddress, amount] tuples representing the swap
 * @param options Message configuration options
 * @returns Intent message ready to be signed by a wallet
 */
export function createSwapIntentMessage(
  swapConfig: [string, bigint][],
  options: IntentMessageConfig
): walletMessage.WalletMessage {
  const innerMessage = messageFactory.makeInnerSwapMessage({
    tokenDeltas: swapConfig,
    signerId: resolveSignerId(options.signerId),
    deadlineTimestamp: options.deadlineTimestamp ?? minutesFromNow(5),
    referral: options.referral,
    memo: options.memo,
    appFee: [],
    appFeeRecipient: "",
  })

  return messageFactory.makeSwapMessage({
    innerMessage,
    nonce: options.nonce,
  })
}

/**
 * Creates an empty intent message that can be used for testing connections
 * @param options Message configuration options
 * @returns Intent message ready to be signed by a wallet
 */
export function createEmptyIntentMessage(
  options: IntentMessageConfig
): walletMessage.WalletMessage {
  return messageFactory.makeEmptyMessage({
    signerId: resolveSignerId(options.signerId),
    deadlineTimestamp: options.deadlineTimestamp ?? minutesFromNow(5),
    nonce: options.nonce,
  })
}

export function createWalletVerificationMessage(
  options: IntentMessageConfig,
  chainType?: string
): walletMessage.WalletMessage {
  const baseMessage = messageFactory.makeEmptyMessage({
    signerId: resolveSignerId(options.signerId),
    deadlineTimestamp: options.deadlineTimestamp ?? minutesFromNow(5),
    nonce: options.nonce,
  })

  // For Tron wallets, we need to add a field to ensure message size compatibility
  // with Tron Ledger app requirements (>225 bytes to avoid signing bugs)
  if (chainType === "tron") {
    const tronMessage = JSON.parse(baseMessage.TRON.message)
    const extendedMessage = {
      ...tronMessage,
      message_size_validation:
        "Validates message size compatibility with wallet signing requirements.",
    }
    return {
      ...baseMessage,
      TRON: {
        ...baseMessage.TRON,
        message: JSON.stringify(extendedMessage, null, 2),
      },
    }
  }
  return baseMessage
}

export function minutesFromNow(minutes: number): number {
  return Date.now() + minutes * 60 * 1000
}

/**
 * Creates an intent message for token transfers
 * @param tokenDeltas Array of [tokenAddress, amount] tuples representing the transfer
 * @param options Message configuration options
 * @returns Intent message ready to be signed by a wallet
 */
export function createTransferMessage(
  tokenDeltas: [string, bigint][],
  options: IntentMessageConfig & { receiverId: string }
): walletMessage.WalletMessage {
  const innerMessage = messageFactory.makeInnerTransferMessage({
    tokenDeltas,
    signerId: resolveSignerId(options.signerId),
    deadlineTimestamp: options.deadlineTimestamp ?? minutesFromNow(5),
    receiverId: options.receiverId,
    memo: options.memo,
  })

  return messageFactory.makeSwapMessage({
    innerMessage,
    nonce: options.nonce,
  })
}
