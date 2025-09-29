import { configureSDK } from "@src/components/DefuseSDK/config"
import { APP_ENV, INTENTS_ENV } from "@src/utils/environment"

let hasInitialized = false

export function initSDK() {
  if (hasInitialized) {
    return
  }
  hasInitialized = true

  if (APP_ENV === "development") {
    configureSDK({
      env: INTENTS_ENV,
      features: {
        hyperliquid: true,
        ton: true,
        avalanche: true,
        sui: true,
        stellar: true,
        optimism: true,
        aptos: true,
      },
    })
  } else {
    configureSDK({
      env: INTENTS_ENV,
      features: {
        hyperliquid: true,
        ton: true,
        sui: true,
        optimism: true,
        avalanche: true,
        stellar: true,
        aptos: true,
      },
    })
  }
}
