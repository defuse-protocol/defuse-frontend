// Default formatting: show full precision up to 11 total digits, then truncate.
// When explicit options (significantDigits, maxDecimals) are provided,
// those limits apply instead.
const DEFAULT_SIG_DIGITS = 6
const DEFAULT_MAX_DECIMALS = 5
const MAX_DISPLAY_DIGITS = 11
const MAX_DISPLAY_LENGTH = 14

type FormatOptions = {
  significantDigits?: number // Total significant digits to show
  maxDecimals?: number // Maximum decimal places
  locale?: boolean // Add thousand separators (1,234.56)
  compact?: boolean // Use K/M/B notation for large numbers
  min?: number | null // Show "< min" for values below threshold
  fractionDigits?: number // Legacy: exact decimal places (overrides smart formatting)
}

// Truncates (not rounds) to avoid displaying more than actual value.
// This is safer for trading - users never see inflated amounts.
//
// Priority: fractionDigits > min > compact > smart formatting
//
// formatTokenValue(1234567890000000000n, 18) → "1.23456789"
// formatTokenValue(169677343970239n, 18) → "0.0001696773"
// formatTokenValue(1234567000000000000000n, 18, { compact: true }) → "1.23K"
export function formatTokenValue(
  num: bigint | string | number,
  decimals: number,
  options: FormatOptions = {}
): string {
  const value = bigintToNumber(num, decimals)
  if (value === 0) return "0"

  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""
  const sigDigits = options.significantDigits ?? DEFAULT_SIG_DIGITS
  const maxDec = options.maxDecimals ?? DEFAULT_MAX_DECIMALS
  const hasExplicitOptions =
    options.significantDigits !== undefined || options.maxDecimals !== undefined

  // Legacy mode: exact decimal places
  if (options.fractionDigits !== undefined) {
    return sign + truncateAndFormat(abs, options.fractionDigits)
  }

  // Min threshold check
  if (options.min != null && abs > 0 && abs < options.min) {
    const dp = options.min < 1 ? -Math.floor(Math.log10(options.min)) : 0
    return `< ${sign}${options.min.toFixed(dp)}`
  }

  // Compact notation for large numbers (1.23K, 1.23M)
  if (options.compact && abs >= 1000) {
    return sign + formatCompact(abs, 3)
  }

  // Small values (< 1)
  if (abs < 1) {
    const leadingZeros = -Math.floor(Math.log10(abs)) - 1

    // More than 10 leading zeros: use subscript notation
    // 0.000000000000000001 → "0.0₁₇1" (17 zeros, then 1)
    if (leadingZeros > 10) {
      return sign + formatSubscript(abs, leadingZeros, sigDigits)
    }

    // If explicit options provided, use them
    if (hasExplicitOptions) {
      const decPlaces = Math.min(leadingZeros + sigDigits, MAX_DISPLAY_DIGITS)
      return sign + truncateAndFormat(abs, decPlaces)
    }

    // Default: show full precision if ≤ MAX_DISPLAY_DIGITS, otherwise truncate
    const maxPrecision = Math.min(leadingZeros + sigDigits + 2, 15)
    const fullPrecision = truncateAndFormat(abs, maxPrecision)
    const digitCount = fullPrecision.replace(".", "").length

    if (digitCount <= MAX_DISPLAY_DIGITS) {
      return sign + fullPrecision
    }

    // Truncate to MAX_DISPLAY_DIGITS, but ensure we show at least 1 significant digit
    // For values like 0.00000000004 (10 zeros + 1 digit = 12 total), show all
    const minDecPlaces = leadingZeros + 1
    const targetDecPlaces = MAX_DISPLAY_DIGITS - 1 // account for leading 0
    const decPlaces = Math.max(minDecPlaces, targetDecPlaces)
    return sign + truncateAndFormat(abs, decPlaces)
  }

  // Large values (>= 1)
  const intDigits = Math.floor(Math.log10(abs)) + 1
  const sigDecPlaces = Math.max(0, sigDigits - intDigits)

  if (options.locale) {
    return sign + formatWithLocale(abs, Math.min(sigDecPlaces, maxDec))
  }

  // If explicit options provided, use them
  if (hasExplicitOptions) {
    const decPlaces = Math.min(sigDecPlaces, maxDec)
    return sign + truncateAndFormat(abs, decPlaces)
  }

  // Default: show full precision if ≤ MAX_DISPLAY_DIGITS, otherwise truncate
  // 1.234567890 (10 digits) → keep as is
  // 1.234567890123 (13 digits) → truncate to 1.2345678901 (11 digits)
  const actualDecimals = countDecimals(abs)
  const fullPrecision = truncateAndFormat(abs, actualDecimals)
  const digitCount = fullPrecision.replace(".", "").length

  if (digitCount <= MAX_DISPLAY_DIGITS) {
    return sign + fullPrecision
  }

  // Truncate to MAX_DISPLAY_DIGITS total digits
  const decPlaces = Math.max(0, MAX_DISPLAY_DIGITS - intDigits)
  return sign + truncateAndFormat(abs, decPlaces)
}

// bigintToNumber(1234567890000000000n, 18) → 1.23456789
// bigintToNumber(169677343970239n, 18) → 0.000169677343970239
//
// Note: JavaScript Number has ~15-17 significant digits of precision.
// For very large integers (>15 digits), we truncate the fractional part
// to preserve the integer portion's accuracy (more important for display).
function bigintToNumber(
  num: bigint | string | number,
  decimals: number
): number {
  let n = BigInt(num)
  const neg = n < 0n
  if (neg) n = -n

  const divisor = 10n ** BigInt(decimals)
  const int = n / divisor
  const intStr = int.toString()
  let frac = (n % divisor).toString().padStart(decimals, "0")

  // Only truncate fractional digits when integer part is very large (>12 digits)
  // This preserves precision for small values while protecting large integer accuracy
  if (intStr.length > 12) {
    const maxFracDigits = Math.max(0, 15 - intStr.length)
    frac = frac.slice(0, maxFracDigits)
  }

  const result = frac ? Number(`${intStr}.${frac}`) : Number(intStr)
  return neg ? -result : result
}

// truncateAndFormat(1.23456789, 5) → "1.23456"
// truncateAndFormat(0.000169677, 9) → "0.000169677"
function truncateAndFormat(value: number, decPlaces: number): string {
  if (decPlaces === 0) return Math.trunc(value).toString()

  const fixed = value.toFixed(decPlaces + 2)
  const truncated = fixed.slice(0, fixed.indexOf(".") + decPlaces + 1)

  return removeTrailingZeros(truncated)
}

// formatWithLocale(1234.56789, 2) → "1,234.56"
function formatWithLocale(value: number, decPlaces: number): string {
  const truncated = Math.trunc(value * 10 ** decPlaces) / 10 ** decPlaces
  const [int, frac = ""] = truncated.toFixed(decPlaces).split(".")
  const formattedInt = Number(int).toLocaleString("en-US")
  const trimmedFrac = frac.replace(/0+$/, "")

  return trimmedFrac ? `${formattedInt}.${trimmedFrac}` : formattedInt
}

// formatCompact(1234567, 3) → "1.23M"
function formatCompact(value: number, sigDigits: number): string {
  const mag = Math.floor(Math.log10(value))
  const scale = 10 ** (sigDigits - 1 - mag)
  const truncated = Math.trunc(value * scale) / scale

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumSignificantDigits: sigDigits,
  }).format(truncated)
}

// countDecimals(1.2345) → 4
// countDecimals(100) → 0
function countDecimals(value: number): number {
  const str = value.toString()

  // Handle scientific notation (e.g., 1e-10)
  if (str.includes("e")) {
    const [, exp] = str.split("e")
    return Math.max(0, -Number(exp))
  }

  const dot = str.indexOf(".")
  return dot === -1 ? 0 : str.length - dot - 1
}

// formatSubscript(0.000000000000000001, 17, 6) → "0.0₁₇1"
// formatSubscript(0.00000000000123456, 11, 6) → "0.0₁₁123456"
//
// Used for extremely small values where showing all zeros is impractical.
// The subscript number indicates how many zeros follow the decimal point.
function formatSubscript(
  value: number,
  leadingZeros: number,
  sigDigits: number
): string {
  const subscripts = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"]
  const zeroCount = leadingZeros
    .toString()
    .split("")
    .map((d) => subscripts[Number(d)])
    .join("")

  // Extract significant digits after the leading zeros
  // Shift value to get digits after zeros, then truncate to sigDigits
  const shifted = value * 10 ** (leadingZeros + sigDigits)
  const sigPart = Math.trunc(shifted).toString().slice(0, sigDigits)

  // Remove trailing zeros from the significant part
  const trimmed = sigPart.replace(/0+$/, "") || "0"

  return `0.0${zeroCount}${trimmed}`
}

// removeTrailingZeros("1.23000") → "1.23"
// removeTrailingZeros("1.00") → "1"
// removeTrailingZeros("100") → "100"
export function removeTrailingZeros(value: string): string {
  if (!value?.includes(".")) return value
  return value.replace(/\.?0+$/, "") || "0"
}

// truncateDisplayValue("0.123456789012345") → "0.123456789012" (truncated to MAX_DISPLAY_LENGTH)
// truncateDisplayValue("1234567.89") → "1234567.89"
// truncateDisplayValue("1500000") → "1.5M"
// truncateDisplayValue("0.000000000000000001") → "0.0₁₇1" (subscript when no digit fits)
export function truncateDisplayValue(
  value: string,
  maxLength = MAX_DISPLAY_LENGTH
): string {
  if (!value) return value

  const num = Number.parseFloat(value)
  if (Number.isNaN(num)) return value

  // Compact notation for large values
  if (num >= 1_000_000) {
    return num.toLocaleString("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    })
  }

  if (value.length <= maxLength) {
    return removeTrailingZeros(value)
  }

  const [intPart, decPart] = value.split(".")
  if (!decPart) return value

  const availableDecimals = Math.max(0, maxLength - intPart.length - 1)
  const abs = Math.abs(num)

  // For small values, check if truncation would lose all significant digits
  // If so, use subscript notation to preserve them
  if (abs > 0 && abs < 1) {
    const leadingZeros = -Math.floor(Math.log10(abs)) - 1
    if (availableDecimals <= leadingZeros) {
      const sign = num < 0 ? "-" : ""
      return sign + formatSubscript(abs, leadingZeros, DEFAULT_SIG_DIGITS)
    }
  }

  const truncated =
    availableDecimals === 0
      ? intPart
      : `${intPart}.${decPart.slice(0, availableDecimals)}`

  return removeTrailingZeros(truncated)
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
