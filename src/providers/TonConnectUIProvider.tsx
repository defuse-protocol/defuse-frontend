"use client"

import { NODE_IS_DEVELOPMENT } from "@src/utils/environment"
import { TonConnectUIProvider } from "@tonconnect/ui-react"
import type { ReactNode } from "react"

function TonConnectUIProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <TonConnectUIProvider
      manifestUrl={
        NODE_IS_DEVELOPMENT
          ? // TON Keeper extension does not load manifest from http://localhost, so we fallback to the demo app
            "https://ton-connect.github.io/demo-dapp-with-wallet/tonconnect-manifest.json"
          : `${window.location.origin}/tonconnect-manifest.json`
      }
      walletsRequiredFeatures={
        {
          // signData: { types: ["text"] }, // This will be needed, but it does not work
        }
      }
    >
      {children}
    </TonConnectUIProvider>
  )
}

export { TonConnectUIProviderWrapper as TonConnectUIProvider }
