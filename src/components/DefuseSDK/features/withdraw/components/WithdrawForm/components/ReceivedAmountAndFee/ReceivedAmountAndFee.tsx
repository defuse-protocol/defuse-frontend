import { Flex, Skeleton, Text } from "@radix-ui/themes"
import { clsx } from "clsx"
import { useMemo } from "react"
import type { TokenValue } from "../../../../../../types/base"
import { formatTokenValue } from "../../../../../../utils/format"

export const ReceivedAmountAndFee = ({
  fee,
  totalAmountReceived,
  symbol,
  isLoading,
}: {
  fee: TokenValue
  totalAmountReceived: TokenValue | null
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
        <Text size="1" weight="bold">
          {isLoading ? <Skeleton>100.000000</Skeleton> : receivedAmount}
          {` ${symbol}`}
        </Text>
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

        <Text size="1" weight="bold">
          {isLoading ? (
            <Skeleton>100.000</Skeleton>
          ) : (
            <>
              {fee_} {symbol}
            </>
          )}
        </Text>
      </Flex>
    </>
  )
}
