import { Chains, IntentsSDK } from "@defuse-protocol/intents-sdk"
import { INTENTS_ENV } from "@src/utils/environment"

export const bridgeSDK = new IntentsSDK({
  env: INTENTS_ENV,
  rpc: {
    // hardcoded for now
    [Chains.Polygon]: ["https://polygon-rpc.com"],
    [Chains.BNB]: ["https://bsc-dataseed.bnbchain.org"],
    [Chains.Optimism]: ["https://mainnet.optimism.io"],
    [Chains.Avalanche]: ["https://api.avax.network/ext/bc/C/rpc"],
  },
  referral: "near-intents.intents-referral.near", // TODO: should depend on env
})
