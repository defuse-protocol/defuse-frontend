"use client"

import { Text } from "@radix-ui/themes"

import AssetComboIcon from "@src/components/Network/AssetComboIcon"
import { NetworkTokenWithSwapRoute } from "@src/types/interfaces"
import { smallBalanceToFormat } from "@src/utils/token"
import WidgetCardLink from "@src/components/History/Widget/WidgetCardLink"
import useShortAccountId from "@src/hooks/useShortAccountId"
import { W_NEAR_TOKEN_META } from "@src/constants/tokens"
import { useActiveHover } from "@src/hooks/useActiveHover"

type Props = {
  accountId: string
  tokenOut: string
  selectedTokenOut: NetworkTokenWithSwapRoute
  hash: string
}

const NEAR_EXPLORER = process?.env?.nearExplorer ?? ""

const WidgetCardWithdraw = ({
  accountId,
  tokenOut,
  selectedTokenOut,
  hash,
}: Props) => {
  const { isActive, handleMouseLeave, handleMouseOver } = useActiveHover()
  const { shortAccountId } = useShortAccountId(accountId)

  return (
    <div
      onClick={() => {
        window.open(NEAR_EXPLORER + "/txns/" + hash)
      }}
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseLeave}
      className="relative flex flex-nowrap justify-between items-center p-2.5 gap-3 hover:bg-gray-950 hover:dark:bg-black-950 cursor-pointer"
    >
      <div className="flex-none w-[40px] h-[36px]">
        <AssetComboIcon
          {...selectedTokenOut}
          icon={W_NEAR_TOKEN_META.icon}
          chainIcon={W_NEAR_TOKEN_META.chainIcon}
        />
      </div>
      <div className="shrink grow flex flex-col justify-between items-start">
        <Text
          size="2"
          weight="medium"
          className="text-black-400 dark:text-white"
        >
          Withdraw
        </Text>
        {!isActive && (
          <span className="flex gap-1">
            <Text
              size="1"
              weight="medium"
              className="text-gray-600 dark:text-gray-500"
            >
              To {shortAccountId}
            </Text>
          </span>
        )}
        {isActive && (
          <span className="flex gap-1">
            <Text
              size="1"
              weight="medium"
              className="text-gray-600 dark:text-gray-500"
            >
              View transaction
            </Text>
          </span>
        )}
      </div>
      {!isActive && (
        <div className="shrink grow flex flex-col justify-between items-end">
          <Text
            size="1"
            weight="medium"
            className="text-gray-600 dark:text-gray-500"
          >
            Completed
          </Text>
          <span className="flex gap-1">
            <Text size="1" weight="medium" className="text-green-400">
              +{smallBalanceToFormat(tokenOut, 7)}
            </Text>
            <Text size="1" weight="medium" className="text-green-400">
              NEAR
            </Text>
          </span>
        </div>
      )}
      {isActive && (
        <div className="flex-none">
          <WidgetCardLink />
        </div>
      )}
    </div>
  )
}

export default WidgetCardWithdraw
