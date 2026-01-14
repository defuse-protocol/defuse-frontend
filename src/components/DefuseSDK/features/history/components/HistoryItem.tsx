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
  TransactionType,
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
  formatSmartDate,
  formatUsd,
} from "../../../utils/format"
import type { TransactionType as BadgeType } from "../../account/types/sharedTypes"

interface HistoryItemProps {
  transaction: SwapTransaction
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
  badgeType?: BadgeType
  hideChainInfo?: boolean
}

function formatChainName(chain: string): string {
  return chain.charAt(0).toUpperCase() + chain.slice(1).toLowerCase()
}

function getBadgeTypeFromTransactionType(type: TransactionType): BadgeType {
  switch (type) {
    case "deposit":
      return "receive"
    case "withdrawal":
      return "send"
    default:
      return "swap"
  }
}

function TokenDisplay({
  tokenAmount,
  tokenList,
  badgeType,
  hideChainInfo,
}: TokenDisplayProps) {
  const token = useMemo(
    () => findTokenByAssetId(tokenList, tokenAmount.token_id),
    [tokenList, tokenAmount.token_id]
  )

  const displayChain = tokenAmount.blockchain.toLowerCase()
  const originChain = token?.originChainName?.toLowerCase()
  const chainIcon = useMemo(
    () => chainIcons[displayChain as keyof typeof chainIcons],
    [displayChain]
  )
  const hasDifferentOrigin = originChain && originChain !== displayChain

  const content = (
    <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
      <AssetComboIcon
        icon={token?.icon}
        name={token?.name ?? tokenAmount.symbol}
        chainIcon={chainIcon}
        chainName={displayChain}
        showChainIcon={!hideChainInfo && Boolean(chainIcon)}
        badgeType={badgeType}
        sizeClassName="size-7 sm:size-10"
      />
      <div className="flex flex-col min-w-0">
        <span className="text-xs sm:text-sm font-medium truncate">
          {formatAmount(tokenAmount.amount)}
        </span>
        <span className="text-[10px] sm:text-[11px] text-gray-11 truncate">
          {token?.symbol ?? tokenAmount.symbol}
        </span>
      </div>
    </div>
  )

  if (hideChainInfo) {
    return content
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-pointer">{content}</div>
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
                On: {formatChainName(displayChain)}
              </span>
            </>
          ) : (
            <span className="text-gray-400">
              Blockchain: {formatChainName(displayChain)}
            </span>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

const STALE_PENDING_THRESHOLD_MS = 30 * 60 * 1000 // 30 minutes

function StatusBadge({
  status,
  timestamp,
}: { status: SwapTransaction["status"]; timestamp: string }) {
  const statusConfig =
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? DEFAULT_STATUS_CONFIG
  const StatusIcon = statusConfig.icon

  const isPendingStale = useMemo(() => {
    if (status !== "PENDING") return false
    const age = Date.now() - new Date(timestamp).getTime()
    return age > STALE_PENDING_THRESHOLD_MS
  }, [status, timestamp])

  if (status === "PENDING" || status === "PROCESSING") {
    return (
      <div className="flex items-center cursor-default">
        <ReloadIcon
          className={cn("size-3 text-gray-400", {
            "animate-spin": !isPendingStale,
          })}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center size-3 rounded-full cursor-default",
        statusConfig.bgColor
      )}
    >
      <StatusIcon className={cn("size-1.5", statusConfig.iconColor)} />
    </div>
  )
}

export function HistoryItem({ transaction, tokenList }: HistoryItemProps) {
  const statusConfig =
    STATUS_CONFIG[transaction.status as keyof typeof STATUS_CONFIG] ??
    DEFAULT_STATUS_CONFIG

  const explorerUrl = useMemo(() => {
    if (!transaction.deposit_address) return null
    return `${INTENTS_EXPLORER_URL}/transactions/${transaction.deposit_address}`
  }, [transaction.deposit_address])

  const usdValue = formatUsd(transaction.from.amount_usd)
  const badgeType = getBadgeTypeFromTransactionType(transaction.type)
  const isSwap = transaction.type === "swap"

  const displayToken =
    transaction.type === "deposit" ? transaction.to : transaction.from

  return (
    <div className="py-3 px-2 flex items-center gap-3 border-b border-gray-200 last:border-b-0 even:bg-gray-100 transition-colors">
      <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
        {isSwap ? (
          <>
            <div className="w-[70px] sm:w-[100px] flex-shrink-0">
              <TokenDisplay
                tokenAmount={transaction.from}
                tokenList={tokenList}
                badgeType={badgeType}
                hideChainInfo
              />
            </div>
            <ArrowRightIcon
              className="size-3 sm:size-3.5 text-gray-9 flex-shrink-0 mx-0.5 sm:mr-3"
              weight="bold"
            />
            <div className="w-[70px] sm:w-[100px] flex-shrink-0">
              <TokenDisplay
                tokenAmount={transaction.to}
                tokenList={tokenList}
                hideChainInfo
              />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2.5">
            <TokenDisplay
              tokenAmount={displayToken}
              tokenList={tokenList}
              badgeType={badgeType}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        {usdValue && (
          <span className="text-sm font-semibold text-gray-12">{usdValue}</span>
        )}
        <div className="flex items-center gap-1 sm:gap-1.5 text-[11px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-gray-10 cursor-default">
                {formatSmartDate(transaction.timestamp)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs" theme="dark">
              {formatFullDate(transaction.timestamp)}
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
              <StatusBadge
                status={transaction.status}
                timestamp={transaction.timestamp}
              />
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

/** @deprecated Use HistoryItem instead */
export function SwapHistoryItem({
  swap,
  tokenList,
}: { swap: SwapTransaction; tokenList: TokenInfo[] }) {
  return <HistoryItem transaction={swap} tokenList={tokenList} />
}

export function SwapHistoryItemSkeleton() {
  return (
    <div className="py-3 px-2 flex items-center gap-1.5 sm:gap-3 border-b border-gray-200 last:border-b-0">
      <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
        <div className="w-[70px] sm:w-[100px] flex-shrink-0 flex items-center gap-1.5 sm:gap-2.5">
          <Skeleton className="size-7 sm:size-10 rounded-full flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <Skeleton className="h-3 sm:h-[14px] w-8 sm:w-12 mb-0.5 sm:mb-1" />
            <Skeleton className="h-2.5 sm:h-[11px] w-6 sm:w-8" />
          </div>
        </div>
        <Skeleton className="size-3 sm:size-3.5 rounded flex-shrink-0 mx-0.5 sm:mr-3" />
        <div className="w-[70px] sm:w-[100px] flex-shrink-0 flex items-center gap-1.5 sm:gap-2.5">
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
