export function formatTokenValue(
  num: bigint | string | number,
  decimals: number,
  {
    min,
    fractionDigits = decimals,
  }: {
    min?: number
    fractionDigits?: number
  } = {}
): string {
  let numBigInt = BigInt(num)
  if (numBigInt === 0n) {
    return "0"
  }

  const sign = numBigInt < 0n ? -1n : 1n
  numBigInt *= sign
  const signStr = sign < 0n ? "-" : ""

  fractionDigits = Math.min(fractionDigits, decimals)

  const exp = 10n ** BigInt(decimals)
  const fraction = numBigInt % exp
  const integer = numBigInt / exp

  const roundedFraction =
    fraction / 10n ** BigInt(Math.max(decimals - fractionDigits, 0))

  const formatted =
    roundedFraction === 0n
      ? `${integer}`
      : `${integer}.${toFixed(roundedFraction.toString(), fractionDigits)}`

  if (min != null && Number(formatted) < min) {
    const decimalPlaces = min < 1 ? -Math.floor(Math.log10(min)) : 0
    const minFormatted = min.toFixed(decimalPlaces)
    return `<${signStr}${minFormatted}`
  }

  return `${signStr}${formatted}`
}

function toFixed(number: string, digits: number) {
  return trimEnd(number.padStart(digits, "0"), "0")
}

function trimEnd(s: string, char: string) {
  let pointer: number | undefined

  for (let i = s.length - 1; 0 <= i; i--) {
    if (s[i] === char) {
      pointer = i
    } else {
      break
    }
  }

  return pointer != null ? s.slice(0, pointer) : s
}

export function formatUsdAmount(value: number): string {
  try {
    let maximumFractionDigits = 2
    let notation: Intl.NumberFormatOptions["notation"] = "standard"

    if (value < 1) {
      // Show ~2 significant figures
      if (value > 0) {
        const firstSigDigitPos = -Math.floor(Math.log10(value))
        maximumFractionDigits = Math.max(2, Math.min(7, firstSigDigitPos + 1))
      }
      // For value === 0, keep default of 2
    } else if (value >= 1_000_000) {
      // Use compact notation for larger values
      notation = "compact"
    } else if (value >= 500) {
      // Omit cents for bigger USD values
      maximumFractionDigits = 0
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits,
      notation,
    }).format(value)
  } catch {
    return ""
  }
}

export function formatDisplayAmount(amount: string, maxDecimals = 5): string {
  if (!amount) return "0"
  const num = Number.parseFloat(amount)
  if (Number.isNaN(num) || num === 0) return "0"

  const absNum = Math.abs(num)
  const minDisplayable = 1 / 10 ** maxDecimals // 0.00001 for 5 decimals

  if (absNum > 0 && absNum < minDisplayable) {
    return `<${minDisplayable}`
  }

  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  })
}
