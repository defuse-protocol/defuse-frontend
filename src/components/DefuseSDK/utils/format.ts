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

  return num.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function toUtcIsoString(mysqlDatetime: string): string {
  if (!mysqlDatetime) return mysqlDatetime
  if (mysqlDatetime.includes("Z") || mysqlDatetime.includes("+")) {
    return mysqlDatetime
  }
  return `${mysqlDatetime.replace(" ", "T")}Z`
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
