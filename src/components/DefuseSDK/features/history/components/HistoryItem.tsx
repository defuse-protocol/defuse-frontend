import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid"
import TooltipNew from "@src/components/DefuseSDK/components/TooltipNew"
import ListItem from "@src/components/ListItem"
import type { SwapTransaction } from "@src/features/balance-history/types"
import { CurvedArrowIcon } from "@src/icons"
import { useMemo } from "react"
import AssetComboIcon from "../../../components/Asset/AssetComboIcon"
import { INTENTS_EXPLORER_URL } from "../../../constants/blockchains"
import type { TokenInfo } from "../../../types/base"
import {
  formatAmount,
  formatFullDate,
  formatSmartDate,
  formatUsd,
} from "../../../utils/format"
import { findTokenByAssetId } from "../../../utils/token"

interface HistoryItemProps {
  transaction: SwapTransaction
  tokenList: TokenInfo[]
}

export function HistoryItem({ transaction, tokenList }: HistoryItemProps) {
  const explorerUrl = useMemo(() => {
    if (!transaction.deposit_address) return null
    return `${INTENTS_EXPLORER_URL}/transactions/${transaction.deposit_address}`
  }, [transaction.deposit_address])

  const fromToken = useMemo(
    () => findTokenByAssetId(tokenList, transaction.from.token_id),
    [tokenList, transaction.from.token_id]
  )
  const toToken = useMemo(
    () => findTokenByAssetId(tokenList, transaction.to.token_id),
    [tokenList, transaction.to.token_id]
  )

  const usdValue = formatUsd(transaction.from.amount_usd)

  return (
    <ListItem
      dropdownMenuItems={[
        ...(explorerUrl
          ? [
              {
                label: "View on explorer",
                href: explorerUrl,
                icon: ArrowTopRightOnSquareIcon,
              },
            ]
          : []),
      ]}
    >
      <div className="relative flex gap-1 items-start">
        <AssetComboIcon icon={fromToken?.icon} sizeClassName="size-7" />
        <CurvedArrowIcon className="size-3.5 text-gray-400 absolute -bottom-0.5 left-4.5 -rotate-23" />
        <AssetComboIcon icon={toToken?.icon} sizeClassName="size-10" />
      </div>

      <ListItem.Content>
        <ListItem.Subtitle>
          {formatAmount(transaction.from.amount)} {fromToken?.symbol}
        </ListItem.Subtitle>
        <ListItem.Title className="">
          +{formatAmount(transaction.to.amount)} {toToken?.symbol}
        </ListItem.Title>
      </ListItem.Content>

      <ListItem.Content align="end">
        <ListItem.Title>{usdValue}</ListItem.Title>
        <div className="flex items-center gap-1.5 text-sm/4 font-medium text-gray-500">
          <TooltipNew>
            <TooltipNew.Trigger>
              <span className="cursor-default">
                {formatSmartDate(transaction.timestamp)}
              </span>
            </TooltipNew.Trigger>
            <TooltipNew.Content side="top">
              {formatFullDate(transaction.timestamp)}
            </TooltipNew.Content>
          </TooltipNew>
        </div>
      </ListItem.Content>
    </ListItem>
  )
}
