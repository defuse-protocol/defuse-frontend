import { parseUnits as parseUnitsViem } from "viem"

export function parseUnits(val: string, decimals: number): bigint {
  if (val === "") {
    throw new Error("Empty string")
  }
  const normVal = val.replaceAll(",", ".")
  return parseUnitsViem(normVal, decimals)
}
