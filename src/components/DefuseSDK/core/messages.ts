import {
  messageFactory,
  type walletMessage,
} from "@defuse-protocol/internal-utils"
import type { MultiPayloadNarrowed } from "@defuse-protocol/one-click-sdk-typescript"
import { base64, base64urlnopad } from "@scure/base"
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

type Nep413Payload = {
  message: string
  recipient: string
  nonce: string
  callbackUrl?: string
}

export function wrapPayloadAsWalletMessage(
  narrowedPayload: MultiPayloadNarrowed
): walletMessage.WalletMessage {
  const placeholderNep413: walletMessage.NEP413Message = {
    message: "",
    recipient: "",
    nonce: new Uint8Array(32),
  }
  const placeholderErc191: walletMessage.ERC191Message = { message: "" }
  const placeholderSolana: walletMessage.SolanaMessage = {
    message: new Uint8Array(),
  }
  const placeholderStellar: walletMessage.StellarMessage = { message: "" }
  const placeholderWebauthn: walletMessage.WebAuthnMessage = {
    challenge: new Uint8Array(),
    payload: "",
    parsedPayload: {
      deadline: "",
      intents: [],
      signer_id: "",
      nonce: "",
      verifying_contract: "",
    },
  }
  const placeholderTonConnect: walletMessage.TonConnectMessage = {
    message: { type: "text", text: "" },
  }
  const placeholderTron: walletMessage.TronMessage = { message: "" }

  switch (narrowedPayload.standard) {
    case "erc191":
      return {
        ERC191: { message: narrowedPayload.payload },
        NEP413: placeholderNep413,
        SOLANA: placeholderSolana,
        STELLAR: placeholderStellar,
        WEBAUTHN: placeholderWebauthn,
        TON_CONNECT: placeholderTonConnect,
        TRON: placeholderTron,
      }
    case "nep413": {
      const nep413Payload = narrowedPayload.payload as Nep413Payload
      return {
        ERC191: placeholderErc191,
        NEP413: {
          message: nep413Payload.message,
          recipient: nep413Payload.recipient,
          nonce: base64ToUint8Array(nep413Payload.nonce),
          callbackUrl: nep413Payload.callbackUrl ?? undefined,
        },
        SOLANA: placeholderSolana,
        STELLAR: placeholderStellar,
        WEBAUTHN: placeholderWebauthn,
        TON_CONNECT: placeholderTonConnect,
        TRON: placeholderTron,
      }
    }
    case "raw_ed25519":
      return {
        ERC191: placeholderErc191,
        NEP413: placeholderNep413,
        SOLANA: { message: stringToUint8Array(narrowedPayload.payload) },
        STELLAR: placeholderStellar,
        WEBAUTHN: placeholderWebauthn,
        TON_CONNECT: placeholderTonConnect,
        TRON: placeholderTron,
      }
    case "sep53":
      return {
        ERC191: placeholderErc191,
        NEP413: placeholderNep413,
        SOLANA: placeholderSolana,
        STELLAR: { message: narrowedPayload.payload },
        WEBAUTHN: placeholderWebauthn,
        TON_CONNECT: placeholderTonConnect,
        TRON: placeholderTron,
      }
    case "webauthn":
      return {
        ERC191: placeholderErc191,
        NEP413: placeholderNep413,
        SOLANA: placeholderSolana,
        STELLAR: placeholderStellar,
        WEBAUTHN: {
          challenge: messageFactory.makeChallenge(
            stringToUint8Array(narrowedPayload.payload)
          ),
          payload: narrowedPayload.payload,
          parsedPayload: JSON.parse(narrowedPayload.payload),
        },
        TON_CONNECT: placeholderTonConnect,
        TRON: placeholderTron,
      }
    case "ton_connect": {
      const tonPayload = narrowedPayload.payload as unknown
      const tonMessage: walletMessage.TonConnectMessage["message"] =
        typeof tonPayload === "object" &&
        tonPayload != null &&
        "text" in tonPayload &&
        typeof tonPayload.text === "string"
          ? { type: "text", text: tonPayload.text }
          : { type: "text", text: JSON.stringify(tonPayload) }

      return {
        ERC191: placeholderErc191,
        NEP413: placeholderNep413,
        SOLANA: placeholderSolana,
        STELLAR: placeholderStellar,
        WEBAUTHN: placeholderWebauthn,
        TON_CONNECT: { message: tonMessage },
        TRON: placeholderTron,
      }
    }
    case "tip191":
      return {
        ERC191: placeholderErc191,
        NEP413: placeholderNep413,
        SOLANA: placeholderSolana,
        STELLAR: placeholderStellar,
        WEBAUTHN: placeholderWebauthn,
        TON_CONNECT: placeholderTonConnect,
        TRON: { message: narrowedPayload.payload },
      }
    default: {
      const _exhaustiveCheck: never = narrowedPayload
      throw new Error(
        `Unsupported standard: ${(narrowedPayload as { standard: string }).standard}`
      )
    }
  }
}

function base64ToUint8Array(base64Input: string): Uint8Array {
  try {
    return base64.decode(base64Input)
  } catch {
    return base64urlnopad.decode(base64Input)
  }
}

function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str)
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
