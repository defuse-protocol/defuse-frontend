import { configureSDK as configureSDK_iu } from "@defuse-protocol/internal-utils"
import { BASE_URL } from "@src/utils/environment"

interface SDKConfig {
  env: EnvConfig
  features: {
    hyperliquid: boolean
    ton: boolean
    optimism: boolean
    avalanche: boolean
    sui: boolean
    stellar: boolean
    aptos: boolean
  }
}

export interface EnvConfig {
  contractID: string
  poaTokenFactoryContractID: string
  poaBridgeBaseURL: string
  managerConsoleBaseURL: string
  nearIntentsBaseURL: string
  bridgeIndexerURL: string
}

export type NearIntentsEnv = "production" | "stage"

const configsByEnvironment: Record<NearIntentsEnv, EnvConfig> = {
  production: {
    contractID: "intents.near",
    poaTokenFactoryContractID: "omft.near",
    poaBridgeBaseURL: "https://bridge.chaindefuser.com",
    managerConsoleBaseURL: "https://api-mng-console.chaindefuser.com/api/",
    nearIntentsBaseURL: getNearIntentsBaseURL(),
    bridgeIndexerURL: "https://bridge-indexer.chaindefuser.com",
  },
  stage: {
    contractID: "staging-intents.near",
    poaTokenFactoryContractID: "stft.near",
    poaBridgeBaseURL: "https://poa-stage.intents-near.org",
    managerConsoleBaseURL: "https://mng-console-stage.intents-near.org/api/",
    nearIntentsBaseURL: getNearIntentsBaseURL(),
    bridgeIndexerURL: "https://bridge-indexer.chaindefuser.com",
  },
}

export let config: SDKConfig = {
  env: configsByEnvironment.production,
  features: {
    hyperliquid: false,
    ton: false,
    optimism: false,
    avalanche: false,
    sui: false,
    stellar: false,
    aptos: false,
  },
}

export interface ConfigureSDKArgs {
  env?: EnvConfig | NearIntentsEnv
  features?: { [K in keyof SDKConfig["features"]]?: boolean }
}

export function configureSDK({ env, features }: ConfigureSDKArgs): void {
  if (typeof env === "string") {
    config = { ...config, env: configsByEnvironment[env] }
  } else if (env) {
    config = { ...config, env }
  }

  config = {
    ...config,
    features: {
      ...config.features,
      ...features,
    },
  }

  // This is temporary, `configureSDK` will be removed from `internal-utils` package
  // Note: do NOT override solverRelayBaseURL here. The internal-utils library has
  // the correct direct URLs built in (e.g. https://solver-relay-v2.chaindefuser.com).
  // The intents-sdk's bridgeSDK uses these for internal operations like fee estimation
  // quotes. Overriding them with a local proxy URL would break those calls since
  // the API route was removed in favor of server actions.
  configureSDK_iu({
    features,
  })
}

function getNearIntentsBaseURL(): string {
  return typeof window !== "undefined"
    ? `${window.origin}/api/`
    : `${BASE_URL}/api/`
}
