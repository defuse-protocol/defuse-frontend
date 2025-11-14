import * as v from "valibot"

export const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV
export const RUNTIME_NODE_JS = process.env.NEXT_RUNTIME === "nodejs"
export const RUNTIME_EDGE = process.env.NEXT_RUNTIME === "edge"

export const VERCEL_PROJECT_PRODUCTION_URL = process.env
  .VERCEL_PROJECT_PRODUCTION_URL
  ? new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
  : null

export const PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? ""

export const SUPABASE_URL = process.env.SUPABASE_URL
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export const INTENTS_ENV = v.parse(
  v.picklist(["production", "stage"]),
  process.env.NEXT_PUBLIC_INTENTS_ENV || "production"
)
export const INTENTS_API_KEY = process.env.INTENTS_API_KEY

export const CLICKHOUSE_SERVICE_URL = process.env.CLICKHOUSE_SERVICE_URL
export const CLICKHOUSE_API_KEY = process.env.CLICKHOUSE_API_KEY
export const CLICK_HOUSE_URL = process.env.CLICK_HOUSE_URL
export const CLICK_HOUSE_USERNAME = process.env.CLICK_HOUSE_USERNAME
export const CLICK_HOUSE_PASSWORD = process.env.CLICK_HOUSE_PASSWORD

export const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
export const HELPSCOUT_BEACON_ID = process.env.NEXT_PUBLIC_HELPSCOUT_BEACON_ID

export const APP_FEE_BPS = v.parse(
  v.pipe(v.optional(v.string(), "0"), v.transform(Number)),
  process.env.NEXT_PUBLIC_APP_FEE_BPS
)
export const APP_FEE_RECIPIENT = v.parse(
  v.optional(v.string(), ""),
  process.env.NEXT_PUBLIC_APP_FEE_RECIPIENT
)
export const APP_FEE_RECIPIENT_RABITSWAP = v.parse(
  v.optional(v.string(), ""),
  process.env.NEXT_PUBLIC_APP_FEE_RECIPIENT_RABITSWAP
)

export const ONE_CLICK_SWAP_FRACTION =
  v.parse(
    v.pipe(
      v.optional(v.string(), "0"),
      v.transform(Number),
      v.number("NEXT_PUBLIC_ONE_CLICK_SWAP_PERCENTAGE must be a valid number"),
      v.minValue(0, "NEXT_PUBLIC_ONE_CLICK_SWAP_PERCENTAGE must be at least 0"),
      v.maxValue(
        100,
        "NEXT_PUBLIC_ONE_CLICK_SWAP_PERCENTAGE must be at most 100"
      )
    ),
    process.env.NEXT_PUBLIC_ONE_CLICK_SWAP_PERCENTAGE
  ) / 100

export const ONE_CLICK_URL = process.env.ONE_CLICK_URL
export const ONE_CLICK_API_KEY = process.env.ONE_CLICK_API_KEY

export const CRON_SECRET = process.env.CRON_SECRET
