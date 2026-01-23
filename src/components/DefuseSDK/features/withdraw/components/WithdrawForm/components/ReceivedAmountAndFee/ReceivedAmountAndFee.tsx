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
  directionFee,
  isLoading,
}: {
  fee: TokenValue
  totalAmountReceived: TokenValue | null
  feeUsd: number | null
  totalAmountReceivedUsd: number | null
  symbol: string
  directionFee: TokenValue | null
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

  // Calculate direction fee USD value proportionally to the regular fee
  const directionFeeUsd = useMemo<number | null>(() => {
    if (directionFee == null || feeUsd == null || fee.amount === 0n) {
      return null
    }
    // Calculate proportion: directionFee / totalFee * feeUsd
    const totalFeeAmount = fee.amount
    if (totalFeeAmount === 0n) return null
    return (Number(directionFee.amount) / Number(totalFeeAmount)) * feeUsd
  }, [directionFee, feeUsd, fee.amount])

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
            <ApproximateCurrency value={totalAmountReceivedUsd} />
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
            <ApproximateCurrency value={feeUsd} />
          )}
        </div>
      </Flex>

      {directionFee != null && directionFee.amount > 0n && (
        <Flex justify="between" px="2">
          <Text size="1" weight="medium" color="gray">
            Direction fee
          </Text>
          <div className="flex flex-col items-end gap-2 justify-end md:flex-row-reverse md:items-center">
            <Text size="1" weight="bold">
              {isLoading ? (
                <Skeleton>100.000</Skeleton>
              ) : (
                <>
                  {formatTokenValue(directionFee.amount, directionFee.decimals)}{" "}
                  {symbol}
                </>
              )}
            </Text>
            {directionFee.amount > 0n &&
              directionFeeUsd != null &&
              directionFeeUsd > 0 && (
                <ApproximateCurrency value={directionFeeUsd} />
              )}
          </div>
        </Flex>
      )}
    </>
  )
}

const ApproximateCurrency = ({ value }: { value: number }) => (
  <span className="flex items-center text-xs font-medium text-gray-11">
    ~
    <FormattedCurrency
      value={value}
      formatOptions={{ currency: "USD" }}
      className="text-xs font-medium text-gray-11"
    />
  </span>
)
