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
    return `< ${signStr}${min}`
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
    // Omit cents for bigger USD values
    if (value >= 500) maximumFractionDigits = 0
    // Handle tiny amounts of USD to not show $0.00
    else if (value < 1) maximumFractionDigits = 7
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits,
    }).format(value)
  } catch {
    return ""
  }
}
