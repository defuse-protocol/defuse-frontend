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
    return `< ${signStr}${minFormatted}`
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

// From new-frontend
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

export function formatAmount(amount: string): string {
  const num = Number.parseFloat(amount)
  if (Number.isNaN(num)) return amount

  if (num >= 1000) {
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }
  if (num >= 1) {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  if (num >= 0.0001) {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })
}

export function formatUsd(amount: string): string {
  const num = Number.parseFloat(amount)
  if (Number.isNaN(num) || num === 0) return ""

  const formatted = num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `$${formatted}`
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

export function formatFullDate(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDateISO(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString

  return new Intl.DateTimeFormat("en-CA").format(date)
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

export function formatSmartDate(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  // Within 24 hours: show relative time
  if (diffMs < TWENTY_FOUR_HOURS_MS) {
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "now"
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    return `${diffHours}h ago`
  }

  // After 24 hours: show YYYY-MM-dd
  return formatDateISO(dateString)
}
