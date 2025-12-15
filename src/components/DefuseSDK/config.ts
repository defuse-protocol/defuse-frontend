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
  solverRelayBaseURL: string
  managerConsoleBaseURL: string
  nearIntentsBaseURL: string
}

export type NearIntentsEnv = "production" | "stage"

const configsByEnvironment: Record<NearIntentsEnv, EnvConfig> = {
  production: {
    contractID: "intents.near",
    poaTokenFactoryContractID: "omft.near",
    poaBridgeBaseURL: "https://bridge.chaindefuser.com",
    solverRelayBaseURL: getSolverRelayURL(),
    managerConsoleBaseURL: "https://api-mng-console.chaindefuser.com/api/",
    nearIntentsBaseURL: getNearIntentsBaseURL(),
  },
  stage: {
    contractID: "staging-intents.near",
    poaTokenFactoryContractID: "stft.near",
    poaBridgeBaseURL: "https://poa-stage.intents-near.org",
    solverRelayBaseURL: getSolverRelayURL(),
    managerConsoleBaseURL: "https://mng-console-stage.intents-near.org/api/",
    nearIntentsBaseURL: getNearIntentsBaseURL(),
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
  configureSDK_iu({
    env,
    features,
    environments: {
      production: {
        solverRelayBaseURL: getSolverRelayURL(),
      },
      stage: {
        solverRelayBaseURL: getSolverRelayURL(),
      },
    },
  })
}

function getSolverRelayURL(): string {
  return process.env.VERCEL_URL
    ? process.env.VERCEL_URL
    : typeof window !== "undefined"
      ? `${window.origin}/api/solver_relay/`
      : `${BASE_URL}/api/solver_relay/`
}

function getNearIntentsBaseURL(): string {
  return typeof window !== "undefined"
    ? `${window.origin}/api/`
    : `${BASE_URL}/api/`
}
