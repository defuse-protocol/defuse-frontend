import { CheckIcon } from "@heroicons/react/16/solid"
import Alert from "@src/components/Alert"
import type { BaseTokenInfo } from "@src/components/DefuseSDK/types"
import clsx from "clsx"
import { Checkbox } from "radix-ui"
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
  const isError = Boolean(errors.isFundsLooseConfirmed)

  return (
    <Alert variant={isError ? "error" : "info"}>
      <Controller
        control={control}
        name={"isFundsLooseConfirmed" as Path<T>}
        rules={{ required: true }}
        render={({ field }) => (
          <div className="flex">
            <Checkbox.Root
              id="cex-funds-loose-checkbox"
              checked={field.value}
              onCheckedChange={field.onChange}
              className={clsx(
                "mt-0.5 focus-visible:ring-2 focus-visible:ring-offset-1 size-4 shrink-0 rounded-sm border-2 outline-none data-[state=checked]:text-white",
                isError
                  ? "focus-visible:ring-red-600 border-red-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                  : "focus-visible:ring-blue-600 border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              )}
            >
              <Checkbox.Indicator className="flex items-center justify-center">
                <CheckIcon className="-mt-0.5 size-4 shrink-0" />
              </Checkbox.Indicator>
            </Checkbox.Root>

            <label
              htmlFor="cex-funds-loose-checkbox"
              className="cursor-pointer ml-2"
            >
              I understand that withdrawing directly to an exchange address may
              result in loss of funds or other issues.
            </label>
          </div>
        )}
      />

      <TokenSpecificWarning tokenOut={tokenOut} />
    </Alert>
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

  return <div className="ml-6 mt-4">{warningMessage}</div>
}
