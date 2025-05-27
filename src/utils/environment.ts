import * as v from "valibot"

export const NEAR_NODE_URL =
  process.env.nearNodeUrl ?? "https://rpc.mainnet.near.org"
export const NEAR_ENV = process.env.NEAR_ENV ?? "testnet"

export const NODE_IS_DEVELOPMENT = process.env.NODE_ENV === "development"
export const NEXT_RUNTIME_NODE_JS = process.env.NEXT_RUNTIME === "nodejs"
export const NEXT_RUNTIME_EDGE = process.env.NEXT_RUNTIME === "edge"

export const NEXT_PUBLIC_LINK_DOCS = process.env.NEXT_PUBLIC_LINK_DOCS ?? ""
export const NEXT_PUBLIC_PUBLIC_MAIL =
  process?.env?.NEXT_PUBLIC_PUBLIC_MAIL ?? ""
export const NEXT_PUBLIC_PUBLIC_TG = process?.env?.NEXT_PUBLIC_PUBLIC_TG ?? ""

export const SOCIAL_LINK_X = process?.env?.socialX ?? ""
export const SOCIAL_LINK_DISCORD = process?.env?.socialDiscord ?? ""
export const LINK_DOCS = process?.env?.socialDocs ?? ""

export const VERCEL_PROJECT_PRODUCTION_URL = process.env
  .VERCEL_PROJECT_PRODUCTION_URL
  ? new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
  : null

export const PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? ""

export const APP_URL = process?.env?.appUrl ?? "/"

export const SUPABASE_URL = process.env.SUPABASE_URL
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
export const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL

export const DEV_MODE = process?.env?.NEXT_PUBLIC_DEV_MODE === "true"
export const TURN_OFF_APPS = process?.env?.turnOffApps === "true"

export const INTENTS_ENV = v.parse(
  v.picklist(["production", "stage"]),
  process.env.NEXT_PUBLIC_INTENTS_ENV || "production"
)

export const redisEnvVariables =
  typeof window === "undefined"
    ? {
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      } // server only
    : {
        url: process.env.NEXT_PUBLIC_KV_REST_API_URL,
        token: process.env.NEXT_PUBLIC_KV_REST_API_TOKEN,
      } // client only

export const CLICKHOUSE_SERVICE_URL = process.env.CLICKHOUSE_SERVICE_URL
export const CLICKHOUSE_API_KEY = process.env.CLICKHOUSE_API_KEY

export const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
