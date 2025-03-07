export const NEAR_NODE_URL_2 = process?.env?.nearNodeUrl ?? ""
export const NEAR_NODE_URL =
  process.env.nearNodeUrl ?? "https://rpc.mainnet.near.org"
export const NEAR_ENV = process.env.NEAR_ENV ?? "testnet"

export const IS_PRODUCTION = process?.env?.environment === "production"
export const IS_DEVELOPMENT = process.env.environment === "development"
export const ENVIRONMENT = IS_PRODUCTION ? "mainnet" : "testnet"
export const NODE_IS_DEVELOPMENT = process.env.NODE_ENV === "development"
export const NEXT_RUNTIME_NODE_JS = process.env.NEXT_RUNTIME === "nodejs"
export const NEXT_RUNTIME_EDGE = process.env.NEXT_RUNTIME === "edge"

export const SOLVER_RELAY_0_URL = process.env.SOLVER_RELAY_0_URL || ""
export const BITCOIN_INFO_URL = process.env.BITCOIN_INFO_URL ?? ""
export const COINGECKO_API_URL = process.env.COINGECKO_API_URL ?? ""
export const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || ""
export const COINGECKO_API_KEY_LOWER = process?.env?.coingeckoApiKey ?? ""
export const REFERRAL_ACCOUNT = process.env.REFERRAL_ACCOUNT ?? ""

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
export const BASE_RPC = process.env.BASE_RPC || ""
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? ""

export const APP_ORIGINAL_URL = process.env.appUrl ?? "*"
export const APP_URL = process?.env?.appUrl ?? "/"

export const NEAR_EXPLORER = process?.env?.nearExplorer ?? ""
export const BASE_EXPLORER = process?.env?.baseExplorer ?? ""
export const BITCOIN_EXPLORER = process?.env?.bitcoinExplorer ?? ""

export const SUPABASE_URL = process.env.SUPABASE_URL
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
export const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL

export const IS_DISABLE_QUOTING_FROM_SOLVER_0 =
  process?.env?.NEXT_PUBLIC_DISABLE_QUOTING_FROM_SOLVER_0 === "true"

export const DEV_MODE = process?.env?.NEXT_PUBLIC_DEV_MODE === "true" ?? false
export const TURN_OFF_APPS = process?.env?.turnOffApps === "true" ?? true
