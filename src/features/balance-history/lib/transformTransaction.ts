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

export function transformTransaction(
  tx: IntentsExplorerTransaction
): SwapTransaction {
  return {
    id: tx.depositAddress,
    timestamp: tx.createdAt,
    status: normalizeStatus(tx.status),
    from: {
      token_id: tx.originAsset,
      symbol: "",
      amount: tx.amountInFormatted,
      amount_usd: tx.amountInUsd,
    },
    to: {
      token_id: tx.destinationAsset,
      symbol: "",
      amount: tx.amountOutFormatted,
      amount_usd: tx.amountOutUsd,
    },
    transaction_hash: tx.intentHashes ?? "",
    deposit_address: tx.depositAddress,
  }
}
