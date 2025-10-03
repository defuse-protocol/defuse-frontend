import { WarningCircleIcon } from "@phosphor-icons/react"
import { Checkbox, Flex, Text } from "@radix-ui/themes"
import { Callout } from "@radix-ui/themes"
import type { BaseTokenInfo } from "@src/components/DefuseSDK/types"
import type { ReactElement } from "react"
import {
  type Control,
  Controller,
  type FieldErrors,
  type Path,
} from "react-hook-form"

type AcknowledgementCheckboxProps<
  T extends { isFundsLooseConfirmed?: boolean } = {
    isFundsLooseConfirmed?: boolean
  },
> = {
  control: Control<T>
  errors: FieldErrors<T>
  tokenOut: BaseTokenInfo
}

export const AcknowledgementCheckbox = <
  T extends { isFundsLooseConfirmed?: boolean },
>({
  control,
  errors,
  tokenOut,
}: AcknowledgementCheckboxProps<T>) => {
  return (
    <Flex gap="3" align="start">
      <Controller
        control={control}
        name={"isFundsLooseConfirmed" as Path<T>}
        rules={{ required: true }}
        render={({ field }) => (
          <Checkbox
            id="cex-funds-loose-checkbox"
            size="3"
            checked={field.value}
            onCheckedChange={field.onChange}
            className="mt-0.5"
          />
        )}
      />
      <Flex direction="column" gap="2" className="flex-1">
        <Text
          as="label"
          size="1"
          weight="medium"
          color={errors.isFundsLooseConfirmed ? "red" : "gray"}
          htmlFor="cex-funds-loose-checkbox"
          className="cursor-pointer leading-relaxed break-words"
        >
          I understand that withdrawing directly to an exchange address may
          result in loss of funds or other issues.
        </Text>

        <TokenSpecificWarning tokenOut={tokenOut} />
      </Flex>
    </Flex>
  )
}

const TokenSpecificWarning = ({
  tokenOut,
}: { tokenOut: BaseTokenInfo }): ReactElement | null => {
  let warningMessage: string | null = null

  switch (tokenOut.symbol) {
    case "NEAR":
      warningMessage = `Withdrawing ${tokenOut.symbol} to certain exchanges, such as Bitget or Bybit, may lead to loss of funds. Always perform a minimal test withdrawal the first time you send funds to an exchange address.`
      break
    case "PUBLIC":
      warningMessage = `Withdrawing ${tokenOut.symbol} to certain exchanges, such as MEXC, may lead to loss of funds. Always perform a minimal test withdrawal the first time you send funds to an exchange address.`
      break
    default:
      return null
  }

  if (!warningMessage) {
    return null
  }

  return (
    <Callout.Root size="1" color="gray">
      <Callout.Icon>
        <WarningCircleIcon />
      </Callout.Icon>
      <Callout.Text className="text-xs">{warningMessage}</Callout.Text>
    </Callout.Root>
  )
}
