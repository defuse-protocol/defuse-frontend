import { CheckIcon, ExclamationTriangleIcon } from "@heroicons/react/16/solid"
import {
  ArrowRightIcon,
  ArrowSquareOutIcon,
  SpinnerIcon,
} from "@phosphor-icons/react"
import { ReloadIcon } from "@radix-ui/react-icons"
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
import {
  INTENTS_EXPLORER_URL,
  chainIcons,
} from "../../../constants/blockchains"
import type { BaseTokenInfo, TokenInfo } from "../../../types/base"
import { cn } from "../../../utils/cn"
import {
  formatAmount,
  formatFullDate,
  formatRelativeTime,
  formatUsd,
} from "../../../utils/format"

interface SwapItemProps {
  swap: SwapTransaction
  tokenList: TokenInfo[]
}

const DEFAULT_STATUS_CONFIG = {
  icon: SpinnerIcon,
  iconColor: "text-white",
  bgColor: "bg-gray-500",
  label: "Unknown",
} as const

const STATUS_CONFIG = {
  SUCCESS: {
    icon: CheckIcon,
    iconColor: "text-white",
    bgColor: "bg-green-500",
    label: "Completed",
  },
  PROCESSING: {
    icon: SpinnerIcon,
    iconColor: "text-white",
    bgColor: "bg-amber-500",
    label: "Processing",
  },
  PENDING: {
    icon: SpinnerIcon,
    iconColor: "text-white",
    bgColor: "bg-blue-500",
    label: "Pending",
  },
  FAILED: {
    icon: ExclamationTriangleIcon,
    iconColor: "text-white",
    bgColor: "bg-red-500",
    label: "Failed",
  },
} as const

/**
 * Creates a lookup map from token list for O(1) access.
 * Cached by tokenList reference.
 */
const tokenMapCache = new WeakMap<TokenInfo[], Map<string, BaseTokenInfo>>()

function getTokenMap(tokenList: TokenInfo[]): Map<string, BaseTokenInfo> {
  const cached = tokenMapCache.get(tokenList)
  if (cached) return cached

  const map = new Map<string, BaseTokenInfo>()
  for (const token of tokenList) {
    if ("groupedTokens" in token) {
      for (const t of token.groupedTokens) {
        map.set(t.defuseAssetId, t)
      }
    } else {
      map.set(token.defuseAssetId, token)
    }
  }
  tokenMapCache.set(tokenList, map)
  return map
}

function findTokenByAssetId(
  tokenList: TokenInfo[],
  tokenId: string
): BaseTokenInfo | undefined {
  return getTokenMap(tokenList).get(tokenId)
}

interface TokenDisplayProps {
  tokenAmount: TokenAmount
  tokenList: TokenInfo[]
  showBadge?: boolean
}

function formatChainName(chain: string): string {
  return chain.charAt(0).toUpperCase() + chain.slice(1).toLowerCase()
}

function TokenDisplay({
  tokenAmount,
  tokenList,
  showBadge,
}: TokenDisplayProps) {
  const token = useMemo(
    () => findTokenByAssetId(tokenList, tokenAmount.token_id),
    [tokenList, tokenAmount.token_id]
  )

  const swapChain = tokenAmount.blockchain.toLowerCase()
  const originChain = token?.originChainName?.toLowerCase()
  const chainIcon = useMemo(
    () => chainIcons[swapChain as keyof typeof chainIcons],
    [swapChain]
  )
  const hasDifferentOrigin = originChain && originChain !== swapChain

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2.5 cursor-pointer min-w-0">
          <AssetComboIcon
            icon={token?.icon}
            name={token?.name ?? tokenAmount.symbol}
            chainIcon={chainIcon}
            chainName={swapChain}
            showChainIcon={Boolean(chainIcon)}
            badgeType={showBadge ? "swap" : undefined}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">
              {formatAmount(tokenAmount.amount)}
            </span>
            <span className="text-[11px] text-gray-11 truncate">
              {token?.symbol ?? tokenAmount.symbol}
            </span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs" theme="dark">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold">{token?.name ?? tokenAmount.symbol}</span>
          {hasDifferentOrigin ? (
            <>
              <span className="text-gray-400">
                Origin: {formatChainName(originChain)}
              </span>
              <span className="text-gray-400">
                Swapped on: {formatChainName(swapChain)}
              </span>
            </>
          ) : (
            <span className="text-gray-400">
              Blockchain: {formatChainName(swapChain)}
            </span>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

const STALE_PENDING_THRESHOLD_MS = 30 * 60 * 1000 // 30 minutes

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

  return (
    <div className="py-5 px-2 flex items-center gap-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-2 transition-colors -mx-2">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-[100px] flex-shrink-0">
          <TokenDisplay
            tokenAmount={swap.from}
            tokenList={tokenList}
            showBadge
          />
        </div>
        <ArrowRightIcon
          className="size-3.5 text-gray-9 flex-shrink-0 mr-3"
          weight="bold"
        />
        <div className="w-[100px] flex-shrink-0">
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
              {swap.status === "PENDING" || swap.status === "PROCESSING" ? (
                <div className="flex items-center cursor-pointer">
                  <ReloadIcon
                    className={cn("size-3 text-gray-400", {
                      "animate-spin": !isPendingStale,
                    })}
                  />
                </div>
              ) : (
                <div
                  className={cn(
                    "flex items-center justify-center size-3 rounded-full cursor-pointer",
                    statusConfig.bgColor
                  )}
                >
                  <StatusIcon
                    className={cn("size-1.5", statusConfig.iconColor)}
                  />
                </div>
              )}
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs" theme="dark">
              {statusConfig.label}
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
              <span className="text-gray-10 cursor-pointer hover:text-gray-12 transition-colors">
                {formatRelativeTime(swap.timestamp)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs" theme="dark">
              {formatFullDate(swap.timestamp)}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

export function SwapHistoryItemSkeleton() {
  return (
    <div className="py-5 px-2 flex items-center gap-3 border-b border-gray-200 last:border-b-0 -mx-2">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-[100px] flex-shrink-0 flex items-center gap-2.5">
          <Skeleton className="size-10 rounded-full flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <Skeleton className="h-[14px] w-12 mb-1" />
            <Skeleton className="h-[11px] w-8" />
          </div>
        </div>
        <Skeleton className="size-3.5 rounded flex-shrink-0 mr-3" />
        <div className="w-[100px] flex-shrink-0 flex items-center gap-2.5">
          <Skeleton className="size-10 rounded-full flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <Skeleton className="h-[14px] w-12 mb-1" />
            <Skeleton className="h-[11px] w-8" />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <Skeleton className="h-[14px] w-14" />
        <Skeleton className="h-[11px] w-20" />
      </div>
    </div>
  )
}
