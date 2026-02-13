import { Chains, IntentsSDK } from "@defuse-protocol/intents-sdk"
import { INTENTS_ENV } from "@src/utils/environment"
import { settings } from "./settings"

export const bridgeSDK = new IntentsSDK({
  env: INTENTS_ENV,
  rpc: {
    // hardcoded for now
    [Chains.Polygon]: [settings.rpcUrls.polygon],
    [Chains.BNB]: [settings.rpcUrls.bsc],
    [Chains.Optimism]: [settings.rpcUrls.optimism],
    [Chains.Avalanche]: [settings.rpcUrls.avalanche],
  },
  referral: "near-intents.intents-referral.near", // TODO: should depend on env
  features: {
    routeMigratedPoaTokensThroughOmniBridge: true,
  },
})
