import { ChainType } from "@src/hooks/chainType"

export type NearComPromoVariant = "wallet" | "passkey" | "anonymous"

export function getNearComPromoVariant(
  chainType: ChainType | undefined
): NearComPromoVariant {
  if (chainType === undefined) return "anonymous"
  if (chainType === ChainType.WebAuthn) return "passkey"
  return "wallet"
}
