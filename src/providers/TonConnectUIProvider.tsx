"use client"

import { APP_ENV } from "@src/utils/environment"
import { TonConnectUIProvider } from "@tonconnect/ui-react"
import type { ReactNode } from "react"

function TonConnectUIProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <TonConnectUIProvider
      manifestUrl={
        APP_ENV === "development"
          ? // TON Keeper extension does not load manifest from http://localhost, so we fallback to the demo app
            "https://ton-connect.github.io/demo-dapp-with-wallet/tonconnect-manifest.json"
          : typeof window !== "undefined" && window.location?.origin
            ? new URL(
                "/tonconnect-manifest.json",
                window.location.origin
              ).toString()
            : "https://near-intents.org/tonconnect-manifest.json"
      }
      walletsRequiredFeatures={{
        signData: { types: ["text"] },
      }}
    >
      {children}
    </TonConnectUIProvider>
  )
}

export { TonConnectUIProviderWrapper as TonConnectUIProvider }
