import type { GeneratHLAddressParams } from "@src/components/DefuseSDK/sdk/hyperunit/types"
import type { BaseTokenInfo } from "@src/components/DefuseSDK/types"
import type { SupportedChainName } from "@src/components/DefuseSDK/types/base"

/**
 * Resolves the destination network for token withdrawals when Hyperliquid is selected by
 * substituting the network with the token's native blockchain.
 */
export function getHyperliquidSrcChain(
  tokenIn: BaseTokenInfo
): GeneratHLAddressParams["srcChain"] {
  const symbol = tokenIn.symbol
  switch (symbol) {
    case "BTC":
      return "bitcoin"
    case "SOL":
      return "solana"
    case "ETH":
      return "ethereum"
    default:
      throw new Error("Error getting src chain for Hyperliquid")
  }
}

export function getHyperliquidAsset(
  token: BaseTokenInfo
): GeneratHLAddressParams["asset"] {
  switch (token.symbol) {
    case "BTC":
      return "btc"
    case "SOL":
      return "sol"
    case "ETH":
      return "eth"
    default:
      throw new Error("Error getting asset for Hyperliquid")
  }
}

/**
 * Warning: I found mismatch between the docs and the actual minimum withdrawal amount for SOL.
 * @see https://docs.hyperunit.xyz/developers/api/generate-address#request-parameters
 */
export function getMinWithdrawalHiperliquidAmount(
  blockchain: SupportedChainName | "near_intents",
  tokenOut: BaseTokenInfo
) {
  if (blockchain !== "hyperliquid") return null
  switch (tokenOut.chainName) {
    case "bitcoin":
      return {
        amount: 2000000n, // 0.02 BTC
        decimals: 8,
      }
    case "eth":
      return {
        amount: 50000000000000000n, // 0.05 ETH
        decimals: 18,
      }
    case "solana":
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
