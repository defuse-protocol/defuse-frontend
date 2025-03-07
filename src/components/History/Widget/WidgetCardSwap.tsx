"use client"

import { Cross1Icon } from "@radix-ui/react-icons"
import { Button, Text } from "@radix-ui/themes"

import WidgetCardLink from "@src/components/History/Widget/WidgetCardLink"
import WidgetCardMask from "@src/components/History/Widget/WidgetCardMask"
import AssetComboIcon from "@src/components/Network/AssetComboIcon"
import { useActiveHover } from "@src/hooks/useActiveHover"
import { HistoryStatus } from "@src/stores/historyStore"
import {
  BlockchainEnum,
  type NetworkTokenWithSwapRoute,
} from "@src/types/interfaces"
import {
  BASE_EXPLORER,
  BITCOIN_EXPLORER,
  NEAR_EXPLORER,
} from "@src/utils/environment"
import { smallBalanceToFormat } from "@src/utils/token"

enum CardSwapStatusEnum {
  PENDING = "Pending",
  COMPLETED = "Completed",
}

type Props = {
  hash: string
  proof: string | undefined
  intentId: string
  timestamp: number
  status: HistoryStatus
  tokenIn: string
  tokenOut: string
  selectedTokenIn: NetworkTokenWithSwapRoute
  selectedTokenOut: NetworkTokenWithSwapRoute
  handleCloseIntent: ({ id }: { id: string; receiverId?: string }) => void
  receiverId?: string
}

const WidgetCardSwap = ({
  hash,
  proof,
  intentId,
  timestamp,
  status,
  tokenIn,
  tokenOut,
  selectedTokenOut,
  selectedTokenIn,
  handleCloseIntent,
  receiverId,
}: Props) => {
  const { isActive, handleMouseLeave, handleMouseOver } = useActiveHover()

  let cardStatus: CardSwapStatusEnum | null = null
  switch (status) {
    case HistoryStatus.AVAILABLE:
    case HistoryStatus.INTENT_1_AVAILABLE:
      cardStatus = CardSwapStatusEnum.PENDING
      break
    case HistoryStatus.COMPLETED:
    case HistoryStatus.INTENT_1_EXECUTED:
      cardStatus = CardSwapStatusEnum.COMPLETED
      break
  }

  let explorerUrl = ""
  switch (selectedTokenOut?.chainName ?? "") {
    case BlockchainEnum.Near:
      explorerUrl = `${NEAR_EXPLORER}/txns/${hash}`
      break
    case BlockchainEnum.Eth:
      if (proof) {
        explorerUrl = `${BASE_EXPLORER}/tx/${proof}`
        break
      }
      explorerUrl = `${NEAR_EXPLORER}/txns/${hash}`
      break
    case BlockchainEnum.Btc:
      if (proof) {
        explorerUrl = `${BITCOIN_EXPLORER}/tx/${proof}`
        break
      }
      explorerUrl = `${NEAR_EXPLORER}/txns/${hash}`
      break
  }

  return (
    // biome-ignore lint/a11y/useKeyWithMouseEvents lint/a11y/useKeyWithClickEvents: <reason>
    <div
      onClick={() => window.open(explorerUrl)}
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseLeave}
      className="relative flex flex-nowrap justify-between items-center p-2.5 gap-3 hover:bg-gray-950 hover:dark:bg-black-950 cursor-pointer"
    >
      {cardStatus !== CardSwapStatusEnum.COMPLETED && (
        <WidgetCardMask timestamp={timestamp} />
      )}
      <div className="flex-none w-[40px] h-[36px]">
        <AssetComboIcon {...selectedTokenOut} />
      </div>
      <div className="shrink grow flex flex-col justify-between items-start">
        <Text
          size="2"
          weight="medium"
          className="text-black-400 dark:text-white"
        >
          Swap
        </Text>
        {cardStatus === CardSwapStatusEnum.COMPLETED && isActive ? (
          <span className="flex gap-1">
            <Text
              size="1"
              weight="medium"
              className="text-gray-600 dark:text-gray-500"
            >
              View transaction
            </Text>
          </span>
        ) : (
          <span className="flex gap-1">
            <Text
              size="1"
              weight="medium"
              className="text-gray-600 dark:text-gray-500"
            >
              -{smallBalanceToFormat(tokenIn, 7)}
            </Text>
            <Text
              size="1"
              weight="medium"
              className="text-gray-600 dark:text-gray-500"
            >
              {selectedTokenIn.symbol}
            </Text>
          </span>
        )}
      </div>
      {cardStatus === CardSwapStatusEnum.COMPLETED && isActive ? (
        <WidgetCardLink />
      ) : (
        <>
          <div className="shrink grow flex flex-col justify-between items-end">
            <Text
              size="1"
              weight="medium"
              className="text-gray-600 dark:text-gray-500"
            >
              {cardStatus}
            </Text>
            <span className="flex gap-1">
              <Text size="1" weight="medium" className="text-green-400">
                +{smallBalanceToFormat(tokenOut, 7)}
              </Text>
              <Text size="1" weight="medium" className="text-green-400">
                {selectedTokenOut.symbol}
              </Text>
            </span>
          </div>
          {cardStatus !== CardSwapStatusEnum.COMPLETED && (
            <div className="flex-none">
              <Button
                variant="solid"
                color="red"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCloseIntent({ id: intentId, receiverId })
                }}
                className="relative w-[32px] h-[32px] cursor-pointer"
              >
                <Cross1Icon width={16} height={16} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default WidgetCardSwap
