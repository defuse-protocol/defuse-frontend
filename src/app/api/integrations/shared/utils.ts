export const PAIR_SEPARATOR = "___"

/**
 * Utility to insert a decimal point into a string representing an integer value, according to the asset decimals.
 */
export function addDecimalPoint(
  price: string,
  decimalsFromArgs: number | string | null | undefined
) {
  if (!decimalsFromArgs || decimalsFromArgs === "0" || decimalsFromArgs === 0) {
    return price
  }

  const decimals =
    typeof decimalsFromArgs === "number"
      ? decimalsFromArgs
      : Number.parseInt(decimalsFromArgs)

  const isNegative = price.startsWith("-")
  const absPrice = isNegative ? price.slice(1) : price

  // Need to pad with leading zeros
  if (absPrice.length <= decimals) {
    const zerosNeeded = decimals - absPrice.length
    const paddedPrice = "0".repeat(zerosNeeded) + absPrice
    return `${isNegative ? "-" : ""}0.${paddedPrice}`
  }

  const priceBeforeDecimal = absPrice.slice(0, -decimals) || "0"
  const priceAfterDecimal = absPrice.slice(-decimals)
  return `${isNegative ? "-" : ""}${priceBeforeDecimal}.${priceAfterDecimal}`
}

const TRIM_ZERO_REGEX = /\.?0+$/
// Use 50 decimal places for internal calculations to maintain precision
const PRECISION_DECIMALS = 50
const PRECISION_DECIMALS_BIGINT = BigInt(PRECISION_DECIMALS)
const precisionFactor = 10n ** PRECISION_DECIMALS_BIGINT

/**
 * Calculates the price as asset0Amount / asset1Amount with high precision.
 *
 * @param asset0Amount - Raw amount of asset0 (without decimals applied)
 * @param asset1Amount - Raw amount of asset1 (without decimals applied)
 * @param asset0Decimals - Number of decimals for asset0
 * @param asset1Decimals - Number of decimals for asset1
 * @returns Price as a string with high precision
 */
export function calculatePriceWithMaxPrecision(
  asset0Amount: string,
  asset1Amount: string,
  asset0Decimals: number,
  asset1Decimals: number
): string {
  const asset0 = BigInt(asset0Amount)
  const asset1 = BigInt(asset1Amount)

  if (asset0 === 0n || asset1 === 0n) {
    return "0"
  }

  const price =
    (asset0 * precisionFactor * 10n ** BigInt(asset1Decimals)) /
    (asset1 * 10n ** BigInt(asset0Decimals))

  const priceStr = price.toString()

  if (priceStr.length <= PRECISION_DECIMALS) {
    const zerosNeeded = PRECISION_DECIMALS - priceStr.length
    return `0.${"0".repeat(zerosNeeded)}${priceStr}`.replace(
      TRIM_ZERO_REGEX,
      ""
    )
  }

  const integerPart = priceStr.slice(0, priceStr.length - PRECISION_DECIMALS)
  const decimalPart = priceStr.slice(-PRECISION_DECIMALS)
  return `${integerPart}.${decimalPart}`.replace(TRIM_ZERO_REGEX, "")
}
