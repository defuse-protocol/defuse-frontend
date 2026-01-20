import {
  ArrowRightIcon,
  ArrowSquareOutIcon,
  ArrowsClockwise,
  CheckCircleIcon,
  SpinnerIcon,
  WarningIcon,
} from "@phosphor-icons/react"
import { Skeleton } from "@radix-ui/themes"
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
    <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
      <AssetComboIcon
        icon={token?.icon}
        name={token?.name ?? "Unknown"}
        badgeType={badgeType}
        sizeClassName="size-7 sm:size-10"
      />
      <div className="flex flex-col min-w-0">
        <span className="text-xs sm:text-sm font-medium truncate">
          {formatAmount(tokenAmount.amount)}
        </span>
        <span className="text-[10px] sm:text-[11px] text-gray-11 truncate">
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
    <div className="py-3 px-2 flex items-center gap-1.5 sm:gap-3 border-b border-gray-200 last:border-b-0 even:bg-gray-50 transition-colors">
      <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
        <div className="w-[85px] sm:w-[120px] flex-shrink-0">
          <TokenDisplay
            tokenAmount={swap.from}
            tokenList={tokenList}
            badgeType={badgeType}
          />
        </div>
        <ArrowRightIcon
          className="size-3 sm:size-3.5 text-gray-9 flex-shrink-0 mx-0.5 sm:mr-3"
          weight="bold"
        />
        <div className="w-[85px] sm:w-[120px] flex-shrink-0">
          <TokenDisplay tokenAmount={swap.to} tokenList={tokenList} />
        </div>
      </div>

      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        {usdValue && (
          <span className="text-sm font-semibold text-gray-12">{usdValue}</span>
        )}
        <div className="flex items-center gap-1.5 text-[11px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-gray-10 cursor-default">
                {formatSmartDate(swap.timestamp)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs" theme="dark">
              {formatFullDate(swap.timestamp)}
            </TooltipContent>
          </Tooltip>
          {explorerUrl && (
            <>
              <span className="text-gray-10">·</span>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-10 hover:text-gray-12 transition-colors duration-150"
                onClick={(e) => e.stopPropagation()}
                title="View on explorer"
              >
                <ArrowSquareOutIcon className="size-3" />
              </a>
            </>
          )}
          <span className="text-gray-10">·</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center cursor-default">
                {swap.status === "PENDING" || swap.status === "PROCESSING" ? (
                  <ArrowsClockwise
                    className={cn("size-3.5 text-gray-11", {
                      "animate-spin": !isPendingStale,
                    })}
                  />
                ) : (
                  <StatusIcon
                    className={cn("size-3.5", statusConfig.color)}
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
      </div>
    </div>
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
    <div className="py-3 px-2 flex items-center gap-1.5 sm:gap-3 border-b border-gray-200 last:border-b-0">
      <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
        <div className="w-[85px] sm:w-[120px] flex-shrink-0 flex items-center gap-1.5 sm:gap-2.5">
          <Skeleton className="size-7 sm:size-10 rounded-full flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <Skeleton className="h-3 sm:h-[14px] w-8 sm:w-12 mb-0.5 sm:mb-1" />
            <Skeleton className="h-2.5 sm:h-[11px] w-6 sm:w-8" />
          </div>
        </div>
        <Skeleton className="size-3 sm:size-3.5 rounded flex-shrink-0 mx-0.5 sm:mr-3" />
        <div className="w-[85px] sm:w-[120px] flex-shrink-0 flex items-center gap-1.5 sm:gap-2.5">
          <Skeleton className="size-7 sm:size-10 rounded-full flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <Skeleton className="h-3 sm:h-[14px] w-8 sm:w-12 mb-0.5 sm:mb-1" />
            <Skeleton className="h-2.5 sm:h-[11px] w-6 sm:w-8" />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <Skeleton className="h-3 sm:h-[14px] w-10 sm:w-14" />
        <Skeleton className="h-2.5 sm:h-[11px] w-14 sm:w-20" />
      </div>
    </div>
  )
}
