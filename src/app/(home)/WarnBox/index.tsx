import { Text } from "@radix-ui/themes"

import { smallBalanceToFormat } from "@src/utils/token"

import { balanceToDecimal } from "../SwapForm/service/balanceTo"

type WarnBoxProps = {
  allowableNearAmount: string | null
  balance: string
  decimals: number
  setValue: (value: string) => void
}

const WarnBox = ({
  allowableNearAmount,
  balance,
  decimals,
  setValue,
}: WarnBoxProps) => {
  if (allowableNearAmount === null) {
    return null
  }

  const generateWarningBalanceMessage = () => {
    if (allowableNearAmount !== "0") {
      return `You must have ${smallBalanceToFormat((Number(balanceToDecimal(balance, decimals)) - Number(balanceToDecimal(allowableNearAmount ?? "0", decimals))).toString())} Near in wallet for gas fee. The maximum available to swap value is -`
    }
    return "Insufficient NEAR balance for storage. Your account's storage usage exceeds your available balance."
  }

  return (
    <div className="w-full block md:max-w-[472px] mb-5">
      <Text
        size="2"
        weight="medium"
        className="text-red-400 dark:text-primary-400"
      >
        {generateWarningBalanceMessage()}
      </Text>
      {allowableNearAmount !== "0" && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: <reason>
        <span
          onClick={() => {
            const value = balanceToDecimal(allowableNearAmount ?? "0", decimals)
            setValue(value)
          }}
          className="inline-block text-xs px-2 py-0.5 ml-0.5 rounded-full bg-red-100 text-red-400 dark:bg-red-200 dark:text-primary-400 cursor-pointer"
        >
          {smallBalanceToFormat(
            balanceToDecimal(allowableNearAmount ?? "0", decimals),
            7
          )}
        </span>
      )}
    </div>
  )
}

export default WarnBox
