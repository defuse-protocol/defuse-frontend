import type { NextRequest } from "next/server"
import type { z } from "zod"

import { err, ok } from "./result"
import type { ApiResult } from "./types"

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
  const asset1 = BigInt(asset1Amount)
  const asset0 = BigInt(asset0Amount)

  if (asset1 === 0n || asset0 === 0n) {
    return "0"
  }

  const price =
    (asset1 * precisionFactor * 10n ** BigInt(asset0Decimals)) /
    (asset0 * 10n ** BigInt(asset1Decimals))

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

export function validateQueryParams<T extends z.ZodSchema>(
  request: NextRequest,
  schema: T
): Awaited<ApiResult<z.infer<T>>> {
  const res = schema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams)
  )

  return res.success
    ? ok(res.data)
    : err(
        "Bad Request",
        "Query param validation failed",
        res.error.errors.map(({ code, message, path }) => ({
          code,
          message,
          param: path.join("."),
        }))
      )
}

export function defuseAssetIdToGeckoId(
  assetId: string
): Awaited<ApiResult<string>> {
  const [type, contractAddress, tokenId] = assetId.split(":")

  if (type === "nep141") {
    return ok(`NEP-141:${contractAddress}`)
  }

  if (type === "nep245") {
    return ok(`NEP-245:${contractAddress}-${tokenId}`)
  }

  return err("Internal Server Error", `Invalid asset ID: ${assetId}`)
}

export function geckoIdToDefuseAssetId(
  geckoId: string
): Awaited<ApiResult<string>> {
  const [type, contractAddressAndTokenId] = geckoId.split(":")

  if (type === "NEP-141") {
    return ok(`nep141:${contractAddressAndTokenId}`)
  }

  if (type === "NEP-245") {
    const [contractAddress, tokenId] = contractAddressAndTokenId.split("-")
    return ok(`nep245:${contractAddress}:${tokenId}`)
  }

  return err(
    "Bad Request",
    `Invalid Token ID: ${geckoId}. Expected format: NEP-141:<contract-address> | NEP-245:<contract-address>-<token-id>`
  )
}
