import type { SwapTransaction } from "@src/features/balance-history/types"
import type { IntentsExplorerTransaction } from "./intentsExplorerAPI"

function normalizeStatus(
  status: IntentsExplorerTransaction["status"]
): SwapTransaction["status"] {
  switch (status) {
    case "SUCCESS":
      return "SUCCESS"
    case "PROCESSING":
      return "PROCESSING"
    case "PENDING_DEPOSIT":
    case "INCOMPLETE_DEPOSIT":
      return "PENDING"
    case "FAILED":
    case "REFUNDED":
      return "FAILED"
    default:
      return "PENDING"
  }
}

function extractChainFromAssetId(assetId: string): string {
  const colonIndex = assetId.indexOf(":")
  if (colonIndex === -1) return "unknown"
  return assetId.substring(0, colonIndex).toLowerCase()
}

function isNearChain(chain: string): boolean {
  return chain === "near" || chain === "nep141"
}

export function transformTransaction(
  tx: IntentsExplorerTransaction
): SwapTransaction {
  const originChain = extractChainFromAssetId(tx.originAsset)
  const destChain = extractChainFromAssetId(tx.destinationAsset)

  return {
    id: tx.depositAddress,
    type: "swap",
    timestamp: tx.createdAt,
    status: normalizeStatus(tx.status),
    from: {
      token_id: tx.originAsset,
      symbol: "",
      blockchain: isNearChain(originChain) ? "near" : originChain,
      amount: tx.amountInFormatted,
      amount_usd: tx.amountInUsd,
    },
    to: {
      token_id: tx.destinationAsset,
      symbol: "",
      blockchain: isNearChain(destChain) ? "near" : destChain,
      amount: tx.amountOutFormatted,
      amount_usd: tx.amountOutUsd,
    },
    transaction_hash: tx.intentHashes ?? "",
    deposit_address: tx.depositAddress,
  }
}
