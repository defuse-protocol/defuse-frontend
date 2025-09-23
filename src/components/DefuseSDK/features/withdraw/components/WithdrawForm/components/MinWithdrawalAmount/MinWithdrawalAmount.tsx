import { InfoCircledIcon } from "@radix-ui/react-icons"
import { Callout, Skeleton, Text } from "@radix-ui/themes"
import type { BaseTokenInfo, TokenValue } from "../../../../../../types/base"
import { formatTokenValue } from "../../../../../../utils/format"

export const MinWithdrawalAmount = ({
  minWithdrawalAmount,
  tokenOut,
  isLoading,
}: {
  minWithdrawalAmount: TokenValue | null
  tokenOut: BaseTokenInfo
  isLoading: boolean
}) => {
  return (
    minWithdrawalAmount != null &&
    minWithdrawalAmount.amount > 1n && (
      <Callout.Root size="1" color="gray" variant="surface">
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>
          Minimal amount to withdraw is ~
          <Text size="1" weight="bold">
            {isLoading ? (
              <Skeleton>0.000000</Skeleton>
            ) : (
              formatTokenValue(
                minWithdrawalAmount.amount,
                minWithdrawalAmount.decimals
              )
            )}{" "}
            {tokenOut.symbol}
          </Text>
        </Callout.Text>
      </Callout.Root>
    )
  )
}
