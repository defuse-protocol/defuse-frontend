import { Flex, Skeleton, Text } from "@radix-ui/themes"
import { FormattedCurrency } from "@src/components/DefuseSDK/features/account/components/shared/FormattedCurrency"
import { clsx } from "clsx"
import { useMemo } from "react"
import type { TokenValue } from "../../../../../../types/base"
import { formatTokenValue } from "../../../../../../utils/format"

export const ReceivedAmountAndFee = ({
  fee,
  totalAmountReceived,
  feeUsd,
  totalAmountReceivedUsd,
  symbol,
  isLoading,
}: {
  fee: TokenValue
  totalAmountReceived: TokenValue | null
  feeUsd: number | null
  totalAmountReceivedUsd: number | null
  symbol: string
  isLoading: boolean
}) => {
  const fee_ =
    totalAmountReceived == null
      ? "-"
      : formatTokenValue(fee.amount, fee.decimals)

  const receivedAmount = useMemo<string>(() => {
    if (totalAmountReceived == null) {
      return "-"
    }

    return formatTokenValue(
      totalAmountReceived.amount,
      totalAmountReceived.decimals
    )
  }, [totalAmountReceived])

  const zeroFee = fee_ === "0"

  return (
    <>
      <Flex justify="between" px="2">
        <Text size="1" weight="medium" color="gray">
          Received amount
        </Text>
        <div className="flex flex-col items-end gap-2 justify-end md:flex-row-reverse md:items-center">
          <Text size="1" weight="bold" className="whitespace-nowrap">
            {isLoading ? <Skeleton>100.000000</Skeleton> : receivedAmount}
            {` ${symbol}`}
          </Text>
          {receivedAmount !== "-" && totalAmountReceivedUsd && (
            <FormattedCurrency
              value={totalAmountReceivedUsd}
              formatOptions={{ currency: "USD" }}
              className="text-xs font-medium text-gray-11"
            />
          )}
        </div>
      </Flex>

      <Flex
        justify="between"
        px="2"
        className={clsx({ "text-green-a11": zeroFee })}
      >
        <Text
          size="1"
          weight="medium"
          color={!zeroFee ? "gray" : undefined}
          className={clsx({ "text-green-a11": zeroFee })}
        >
          Fee
        </Text>
        <div className="flex flex-col items-end gap-2 justify-end md:flex-row-reverse md:items-center">
          <Text size="1" weight="bold">
            {isLoading ? (
              <Skeleton>100.000</Skeleton>
            ) : (
              <>
                {fee_} {symbol}
              </>
            )}
          </Text>
          {fee_ !== "-" && feeUsd != null && feeUsd > 0 && (
            <FormattedCurrency
              value={feeUsd}
              formatOptions={{ currency: "USD" }}
              className="text-xs font-medium text-gray-11"
            />
          )}
        </div>
      </Flex>
    </>
  )
}
