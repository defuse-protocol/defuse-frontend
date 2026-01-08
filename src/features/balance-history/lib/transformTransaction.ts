import type {
  SwapTransaction,
  TransactionType,
} from "@src/features/balance-history/types"
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

/**
 * Detects transaction type based on asset chain prefixes.
 *
 * Key rule: If BOTH assets are on NEAR (nep141:/near:), it's always a SWAP
 * regardless of internal chain tx hashes (those are system internals, not user actions).
 *
 * - Deposit: External chain asset → NEAR asset
 * - Withdrawal: NEAR asset → External chain asset
 * - Swap: NEAR asset → NEAR asset (same chain)
 */
function detectTransactionType(
  originAsset: string,
  destinationAsset: string,
  _originChainTxHashes: string[],
  _destinationChainTxHashes: string[]
): TransactionType {
  const originChain = extractChainFromAssetId(originAsset)
  const destChain = extractChainFromAssetId(destinationAsset)

  const originIsNear = isNearChain(originChain)
  const destIsNear = isNearChain(destChain)

  // If both are on NEAR, it's a swap (regardless of internal chain tx hashes)
  if (originIsNear && destIsNear) {
    return "swap"
  }

  // External → NEAR = Deposit
  if (!originIsNear && destIsNear) {
    return "deposit"
  }

  // NEAR → External = Withdrawal
  if (originIsNear && !destIsNear) {
    return "withdrawal"
  }

  // Both external (cross-chain bridge) - treat as swap
  return "swap"
}

export function transformTransaction(
  tx: IntentsExplorerTransaction
): SwapTransaction {
  const originChain = extractChainFromAssetId(tx.originAsset)
  const destChain = extractChainFromAssetId(tx.destinationAsset)

  return {
    id: tx.depositAddress,
    type: detectTransactionType(
      tx.originAsset,
      tx.destinationAsset,
      tx.originChainTxHashes,
      tx.destinationChainTxHashes
    ),
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
