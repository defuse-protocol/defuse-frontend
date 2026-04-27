import type { ChainType } from "@src/hooks/useConnectWallet"

export type NearComPromoVariant = "wallet" | "passkey" | "anonymous"

export function getNearComPromoVariant(
  chainType: ChainType | undefined
): NearComPromoVariant {
  if (chainType === undefined) return "anonymous"
  if (chainType === "webauthn") return "passkey"
  return "wallet"
}
