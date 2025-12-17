import {
  ArrowDown,
  ArrowSquareOut,
  ArrowUp,
  ArrowsLeftRight,
  Clock,
} from "@phosphor-icons/react"
import { Skeleton } from "@radix-ui/themes"
import type { BalanceChange } from "@src/features/balance-history/types"
import { useMemo } from "react"
import { AssetComboIcon } from "../../../components/Asset/AssetComboIcon"
import { chainIcons } from "../../../constants/blockchains"
import type {
  BaseTokenInfo,
  SupportedChainName,
  TokenInfo,
} from "../../../types/base"
import { blockExplorerTxLinkFactory } from "../../../utils/chainTxExplorer"
import { cn } from "../../../utils/cn"

interface HistoryItemProps {
  item: BalanceChange
  tokenList: TokenInfo[]
}

const CHANGE_TYPE_CONFIG: Record<
  BalanceChange["change_type"],
  { label: string; icon: typeof ArrowDown; color: string }
> = {
  deposit: { label: "Deposit", icon: ArrowDown, color: "text-green-11" },
  withdrawal: { label: "Withdrawal", icon: ArrowUp, color: "text-red-11" },
  swap_in: { label: "Swap In", icon: ArrowsLeftRight, color: "text-green-11" },
  swap_out: { label: "Swap Out", icon: ArrowsLeftRight, color: "text-red-11" },
  transfer_in: {
    label: "Transfer In",
    icon: ArrowDown,
    color: "text-green-11",
  },
  transfer_out: {
    label: "Transfer Out",
    icon: ArrowUp,
    color: "text-red-11",
  },
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatAmount(amount: string, symbol: string): string {
  const num = Number.parseFloat(amount)
  if (Number.isNaN(num)) return `${amount} ${symbol}`

  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })
  return `${formatted} ${symbol}`
}

function formatUsd(amount: string): string {
  const num = Number.parseFloat(amount)
  if (Number.isNaN(num)) return "-"

  return num.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function findTokenBySymbol(
  tokenList: TokenInfo[],
  symbol: string
): BaseTokenInfo | undefined {
  for (const token of tokenList) {
    if ("groupedTokens" in token) {
      const found = token.groupedTokens.find(
        (t) => t.symbol.toLowerCase() === symbol.toLowerCase()
      )
      if (found) return found
    } else if (token.symbol.toLowerCase() === symbol.toLowerCase()) {
      return token
    }
  }
  return undefined
}

export function HistoryItem({ item, tokenList }: HistoryItemProps) {
  const config = CHANGE_TYPE_CONFIG[item.change_type]
  const Icon = config.icon
  const isPositive = ["deposit", "swap_in", "transfer_in"].includes(
    item.change_type
  )

  const token = useMemo(
    () => findTokenBySymbol(tokenList, item.symbol),
    [tokenList, item.symbol]
  )

  const chainIcon = useMemo(() => {
    const blockchain = item.blockchain.toLowerCase()
    return chainIcons[blockchain as keyof typeof chainIcons]
  }, [item.blockchain])

  const explorerUrl = useMemo(() => {
    const blockchain = item.blockchain.toLowerCase() as SupportedChainName
    return blockExplorerTxLinkFactory(blockchain, item.transaction_hash)
  }, [item.blockchain, item.transaction_hash])

  return (
    <div className="py-3 flex items-center gap-3 border-b border-gray-a3 last:border-b-0 group">
      <AssetComboIcon
        icon={token?.icon}
        name={token?.name ?? item.symbol}
        chainIcon={chainIcon}
        chainName={item.blockchain}
        showChainIcon={Boolean(chainIcon)}
      />

      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Icon
              className={cn("size-4 flex-shrink-0", config.color)}
              weight="bold"
            />
            <span className="text-sm font-bold truncate">{config.label}</span>
          </div>
          <div
            className={cn(
              "text-sm font-medium flex-shrink-0",
              isPositive ? "text-green-11" : "text-red-11"
            )}
          >
            {isPositive ? "+" : "-"}
            {formatAmount(item.amount, item.symbol)}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-11 min-w-0">
            <Clock className="size-3 flex-shrink-0" />
            <span className="truncate">{formatDate(item.block_timestamp)}</span>
            <span className="text-gray-8 flex-shrink-0">|</span>
            <span className="capitalize truncate">{item.blockchain}</span>
            {explorerUrl && (
              <>
                <span className="text-gray-8 flex-shrink-0">|</span>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-0.5 text-accent-11 hover:text-accent-12 transition-colors flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>View</span>
                  <ArrowSquareOut className="size-3" />
                </a>
              </>
            )}
          </div>
          <div className="text-xs text-gray-11 flex-shrink-0">
            {formatUsd(item.amount_usd)}
          </div>
        </div>
      </div>
    </div>
  )
}

export function HistoryItemSkeleton() {
  return (
    <div className="py-3 flex items-center gap-3 border-b border-gray-a3 last:border-b-0">
      <Skeleton className="w-7 h-7 rounded-full" />

      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <Skeleton className="text-sm w-20">Deposit</Skeleton>
          <Skeleton className="text-sm w-24">+100.00 USDC</Skeleton>
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="text-xs w-32">Jan 15, 10:30 AM | near</Skeleton>
          <Skeleton className="text-xs w-16">$100.00</Skeleton>
        </div>
      </div>
    </div>
  )
}
