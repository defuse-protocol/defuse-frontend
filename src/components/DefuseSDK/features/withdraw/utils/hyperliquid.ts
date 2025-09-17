import type { GeneratHLAddressParams } from "@src/components/DefuseSDK/sdk/hyperunit/types"
import type {
  BaseTokenInfo,
  UnifiedTokenInfo,
} from "@src/components/DefuseSDK/types"
import type { SupportedChainName } from "@src/components/DefuseSDK/types/base"
import { getTokenAid } from "@src/components/DefuseSDK/utils/token"

/**
 * Resolves the destination network for token withdrawals when Hyperliquid is selected by
 * substituting the network with the token's native blockchain.
 */
export function getHyperliquidSrcChain(
  token: BaseTokenInfo | UnifiedTokenInfo
): GeneratHLAddressParams["srcChain"] {
  const tokenAid = getTokenAid(token)
  switch (tokenAid) {
    case "btc":
      return "bitcoin"
    case "sol":
      return "solana"
    case "eth":
      return "ethereum"
    default:
      throw new Error("Error getting src chain for Hyperliquid")
  }
}

export function getHyperliquidAsset(
  token: BaseTokenInfo
): GeneratHLAddressParams["asset"] {
  const tokenAid = getTokenAid(token)
  switch (tokenAid) {
    case "btc":
      return "btc"
    case "sol":
      return "sol"
    case "eth":
      return "eth"
    default:
      throw new Error("Error getting asset for Hyperliquid")
  }
}

/**
 * Warning: I found mismatch between the docs and the actual minimum withdrawal amount for SOL.
 * @see https://docs.hyperunit.xyz/developers/api/generate-address#request-parameters
 */
export function getMinWithdrawalHyperliquidAmount(
  blockchain: SupportedChainName | "near_intents",
  token: BaseTokenInfo | UnifiedTokenInfo
) {
  if (blockchain !== "hyperliquid") return null
  const tokenAid = getTokenAid(token)
  switch (tokenAid) {
    case "btc":
      return {
        amount: 2000000n, // 0.02 BTC
        decimals: 8,
      }
    case "eth":
      return {
        amount: 50000000000000000n, // 0.05 ETH
        decimals: 18,
      }
    case "sol":
      return {
        amount: 200000000n, // 0.2 SOL
        decimals: 9,
      }
    default:
      throw new Error("Error getting min withdrawal amount for Hyperliquid")
  }
}

export function isHyperliquid(
  blockchain: SupportedChainName | "near_intents"
): boolean {
  return blockchain === "hyperliquid"
}
