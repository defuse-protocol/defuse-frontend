import { toUtcIsoString } from "@src/components/DefuseSDK/utils/format"
import type {
  SwapTransaction,
  TokenAmount,
} from "@src/features/balance-history/types"

import type { SwapRecord } from "./swapHistoryRepository"

function extractIntentHash(intentHashes: string | null): string {
  if (!intentHashes) return ""

  if (intentHashes.startsWith("[")) {
    try {
      const parsed = JSON.parse(intentHashes)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return String(parsed[0])
      }
    } catch {
      // Not JSON, try comma-separated
    }
  }

  const first = intentHashes.split(",")[0]
  return first?.trim() ?? ""
}

function normalizeStatus(status: string): SwapTransaction["status"] {
  const upperStatus = status.toUpperCase()
  if (upperStatus === "SUCCESS") return "SUCCESS"
  if (upperStatus === "PROCESSING") return "PROCESSING"
  if (upperStatus === "PENDING_DEPOSIT") return "PENDING"
  if (upperStatus === "REFUNDED") return "FAILED"
  if (upperStatus.includes("PENDING")) return "PENDING"
  if (upperStatus.includes("FAIL") || upperStatus.includes("ERROR"))
    return "FAILED"
  return "PENDING"
}

export function transformSwapRecord(swap: SwapRecord): SwapTransaction {
  const intentHash = extractIntentHash(swap.intentHashes)

  const from: TokenAmount = {
    token_id: swap.originAsset,
    symbol: "",
    blockchain: "near",
    amount: swap.amountInFormatted,
    amount_usd: swap.amountInUsd,
  }

  const to: TokenAmount = {
    token_id: swap.destinationAsset,
    symbol: "",
    blockchain: "near",
    amount: swap.amountOutFormatted,
    amount_usd: swap.amountOutUsd,
  }

  return {
    id: String(swap.id),
    timestamp: toUtcIsoString(swap.createdAt),
    status: normalizeStatus(swap.status),
    from,
    to,
    transaction_hash: intentHash,
    deposit_address: swap.depositAddress,
  }
}
