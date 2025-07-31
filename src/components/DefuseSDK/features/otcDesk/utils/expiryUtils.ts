import * as v from "valibot"

export type ExpiryFormatted = `${number}{"m" | "h" | "d"}`

export type Expiry = v.InferOutput<typeof ExpiryScheme>

const ExpiryScheme = v.pipe(
  v.string(),
  v.transform((a) => parseExpiryString(a)),
  v.object({
    unit: v.picklist(["m", "h", "d"]),
    value: v.number(),
  })
)

export function parseExpiry(str: string): Expiry | null {
  const a = v.safeParse(ExpiryScheme, str)
  return a.success ? a.output : null
}

function parseExpiryString(expiry: string) {
  const regexp = /^(\d+)([mhd])$/
  const match = expiry.match(regexp)

  if (!match) return null

  const [, value, unit] = match
  if (value === undefined || unit === undefined) return null

  return {
    unit: unit,
    value: Number.parseInt(value),
  }
}

export function expiryToSeconds(expiry: Expiry): number {
  const { unit, value } = expiry
  switch (unit) {
    case "m":
      return value * 60
    case "h":
      return value * 60 * 60
    case "d":
      return value * 60 * 60 * 24
    default:
      unit satisfies never
      return 0
  }
}
