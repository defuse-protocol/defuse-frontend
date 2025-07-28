import { InfoCircledIcon } from "@radix-ui/react-icons"
import { Callout, Text } from "@radix-ui/themes"
import type { BaseTokenInfo, TokenValue } from "../../../../../../types/base"
import { formatTokenValue } from "../../../../../../utils/format"

export const MinWithdrawalAmount = ({
  minWithdrawalAmount,
  tokenOut,
}: {
  minWithdrawalAmount: TokenValue | null
  tokenOut: BaseTokenInfo
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
            {formatTokenValue(
              minWithdrawalAmount.amount,
              minWithdrawalAmount.decimals
              // biome-ignore lint/nursery/useConsistentCurlyBraces: space is needed here
            )}{" "}
            {tokenOut.symbol}
          </Text>
        </Callout.Text>
      </Callout.Root>
    )
  )
}
