import { BridgeSDK } from "@defuse-protocol/bridge-sdk"

export const bridgeSDK = new BridgeSDK({
  evmRpc: {
    // hardcoded for now
    137: ["https://polygon-rpc.com"],
    56: ["https://bsc-dataseed.bnbchain.org"],
    10: ["https://mainnet.optimism.io"],
    43114: ["https://api.avax.network/ext/bc/C/rpc"],
  },
  referral: "near-intents.intents-referral.near", // TODO: should depend on env
})
