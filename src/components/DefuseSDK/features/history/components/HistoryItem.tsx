import {
  ArrowRightIcon,
  ArrowSquareOutIcon,
  ArrowsClockwise,
  CheckCircleIcon,
  SpinnerIcon,
  WarningIcon,
} from "@phosphor-icons/react"
import { Skeleton } from "@radix-ui/themes"
import ListItem from "@src/components/ListItem"
import type {
  SwapTransaction,
  TokenAmount,
} from "@src/features/balance-history/types"
import { useMemo } from "react"
import AssetComboIcon from "../../../components/Asset/AssetComboIcon"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../components/Tooltip"
import { INTENTS_EXPLORER_URL } from "../../../constants/blockchains"
import type { TokenInfo } from "../../../types/base"
import { cn } from "../../../utils/cn"
import {
  formatAmount,
  formatFullDate,
  formatSmartDate,
  formatUsd,
} from "../../../utils/format"
import { findTokenByAssetId } from "../../../utils/token"
import type { TransactionType as BadgeType } from "../../account/types/sharedTypes"

interface SwapItemProps {
  swap: SwapTransaction
  tokenList: TokenInfo[]
}

const DEFAULT_STATUS_CONFIG = {
  icon: SpinnerIcon,
  color: "text-gray-11",
  label: "Unknown",
} as const

const STATUS_CONFIG = {
  SUCCESS: {
    icon: CheckCircleIcon,
    color: "text-green-600",
    label: "Completed",
  },
  PROCESSING: {
    icon: SpinnerIcon,
    color: "text-amber-500",
    label: "Processing",
  },
  PENDING: {
    icon: SpinnerIcon,
    color: "text-blue-500",
    label: "Pending",
  },
  FAILED: {
    icon: WarningIcon,
    color: "text-red-500",
    label: "Failed",
  },
} as const

interface TokenDisplayProps {
  tokenAmount: TokenAmount
  tokenList: TokenInfo[]
  badgeType?: BadgeType
}

function TokenDisplay({
  tokenAmount,
  tokenList,
  badgeType,
}: TokenDisplayProps) {
  const token = useMemo(
    () => findTokenByAssetId(tokenList, tokenAmount.token_id),
    [tokenList, tokenAmount.token_id]
  )

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <AssetComboIcon icon={token?.icon} badgeType={badgeType} />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-base/5 font-semibold text-gray-900 truncate">
          {formatAmount(tokenAmount.amount)}
        </span>
        <span className="text-sm/4 font-medium text-gray-500 truncate">
          {token?.symbol ?? "Unknown"}
        </span>
      </div>
    </div>
  )
}

const STALE_PENDING_THRESHOLD_MS = 3 * 60 * 1000 // 3 minutes

export function SwapHistoryItem({ swap, tokenList }: SwapItemProps) {
  const statusConfig =
    STATUS_CONFIG[swap.status as keyof typeof STATUS_CONFIG] ??
    DEFAULT_STATUS_CONFIG
  const StatusIcon = statusConfig.icon

  const isPendingStale = useMemo(() => {
    if (swap.status !== "PENDING") return false
    const age = Date.now() - new Date(swap.timestamp).getTime()
    return age > STALE_PENDING_THRESHOLD_MS
  }, [swap.status, swap.timestamp])

  const explorerUrl = useMemo(() => {
    if (!swap.deposit_address) return null
    return `${INTENTS_EXPLORER_URL}/transactions/${swap.deposit_address}`
  }, [swap.deposit_address])

  const usdValue = formatUsd(swap.from.amount_usd)
  const badgeType: BadgeType = "swap"

  return (
    <ListItem>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <TokenDisplay
          tokenAmount={swap.from}
          tokenList={tokenList}
          badgeType={badgeType}
        />
        <ArrowRightIcon
          className="size-4 text-gray-400 shrink-0"
          weight="bold"
        />
        <TokenDisplay tokenAmount={swap.to} tokenList={tokenList} />
      </div>

      <ListItem.Content align="end">
        <ListItem.Title>{usdValue}</ListItem.Title>
        <div className="flex items-center gap-1.5 text-sm/4 font-medium text-gray-500">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-default">
                {formatSmartDate(swap.timestamp)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs" theme="dark">
              {formatFullDate(swap.timestamp)}
            </TooltipContent>
          </Tooltip>
          {explorerUrl && (
            <>
              <span>·</span>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
                title="View on explorer"
              >
                <ArrowSquareOutIcon className="size-4" />
              </a>
            </>
          )}
          <span>·</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center cursor-default">
                {swap.status === "PENDING" || swap.status === "PROCESSING" ? (
                  <ArrowsClockwise
                    className={cn("size-4 text-gray-500", {
                      "animate-spin": !isPendingStale,
                    })}
                  />
                ) : (
                  <StatusIcon
                    className={cn("size-4", statusConfig.color)}
                    weight="fill"
                  />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs" theme="dark">
              {statusConfig.label}
            </TooltipContent>
          </Tooltip>
        </div>
      </ListItem.Content>
    </ListItem>
  )
}

/** Alias for activity page compatibility */
export function HistoryItem({
  transaction,
  tokenList,
}: { transaction: SwapTransaction; tokenList: TokenInfo[] }) {
  return <SwapHistoryItem swap={transaction} tokenList={tokenList} />
}

export function SwapHistoryItemSkeleton() {
  return (
    <div className="-mx-4 px-4 rounded-2xl">
      <div className="flex gap-3 items-center py-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Skeleton className="size-10 rounded-full shrink-0" />
            <div className="flex flex-col gap-0.5 min-w-0">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-10" />
            </div>
          </div>
          <Skeleton className="size-4 rounded shrink-0" />
          <div className="flex items-center gap-2.5 min-w-0">
            <Skeleton className="size-10 rounded-full shrink-0" />
            <div className="flex flex-col gap-0.5 min-w-0">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-10" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}
