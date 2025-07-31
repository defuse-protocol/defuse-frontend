import { nearFailoverRpcProvider } from "@defuse-protocol/internal-utils"
import { settings } from "./settings"

/**
 * NEAR RPC providers list from official docs:
 * https://docs.near.org/api/rpc/providers
 */
const reserveRpcUrls = [
  settings.rpcUrls.near,
  "https://free.rpc.fastnear.com",
  "https://rpc.mainnet.near.org",
]

export const nearClient = nearFailoverRpcProvider({
  urls: reserveRpcUrls,
})
