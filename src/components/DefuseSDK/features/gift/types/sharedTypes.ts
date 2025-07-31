import type { SignerCredentials } from "../../../core/formatters"
import type { MultiPayload } from "../../../types/defuse-contracts-types"
import type {
  WalletMessage,
  WalletSignatureResult,
} from "../../../types/walletMessage"
import type { StorageOperationErr } from "../stores/storageOperations"

export type SignMessage = (
  params: WalletMessage
) => Promise<WalletSignatureResult | null>

export type GiftLinkData = {
  secretKey: string
  message: string
}

export type GiftSignedResult = {
  multiPayload: MultiPayload
  signerCredentials: SignerCredentials
  signatureResult: WalletSignatureResult
}

export type CreateGiftIntent = (
  payload: GiftLinkData
) => Promise<{ iv: string; giftId: string }>

export type GenerateLink = (params: {
  secretKey: string
  message: string
  // Fallback to empty string for backwards compatibility with gifts created before IV was added
  iv: null | string
}) => string

export type SavingGiftResult =
  | { tag: "ok"; value: { iv: string } }
  | { tag: "err"; reason: StorageOperationErr }
