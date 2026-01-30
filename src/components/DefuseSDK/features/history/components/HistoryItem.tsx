import { ArrowRightIcon, ArrowSquareOutIcon } from "@phosphor-icons/react"
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
import {
  formatAmount,
  formatFullDate,
  formatSmartDate,
  formatUsd,
} from "../../../utils/format"
import { findTokenByAssetId } from "../../../utils/token"
import type { TransactionType as BadgeType } from "../../account/types/sharedTypes"

interface HistoryItemProps {
  transaction: SwapTransaction
  tokenList: TokenInfo[]
}

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

export function HistoryItem({ transaction, tokenList }: HistoryItemProps) {
  const explorerUrl = useMemo(() => {
    if (!transaction.deposit_address) return null
    return `${INTENTS_EXPLORER_URL}/transactions/${transaction.deposit_address}`
  }, [transaction.deposit_address])

  const usdValue = formatUsd(transaction.from.amount_usd)
  const badgeType: BadgeType = "swap"

  return (
    <ListItem>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-[120px] shrink-0">
          <TokenDisplay
            tokenAmount={transaction.from}
            tokenList={tokenList}
            badgeType={badgeType}
          />
        </div>
        <ArrowRightIcon
          className="size-4 text-gray-400 shrink-0"
          weight="bold"
        />
        <TokenDisplay tokenAmount={transaction.to} tokenList={tokenList} />
      </div>

      <ListItem.Content align="end">
        <ListItem.Title>{usdValue}</ListItem.Title>
        <div className="flex items-center gap-1.5 text-sm/4 font-medium text-gray-500">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-default">
                {formatSmartDate(transaction.timestamp)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs" theme="dark">
              {formatFullDate(transaction.timestamp)}
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
        </div>
      </ListItem.Content>
    </ListItem>
  )
}
