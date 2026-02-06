"use client"

import { APP_ENV } from "@src/utils/environment"
import dynamic from "next/dynamic"
import type { ReactNode } from "react"

// Disable SSR for TonConnectUIProvider to prevent hydration mismatch
// The TON Connect library adds ontouchstart attribute to body during initialization,
// which causes React hydration errors when server and client DOM don't match
const TonConnectUIProvider = dynamic(
  () => import("@tonconnect/ui-react").then((mod) => mod.TonConnectUIProvider),
  { ssr: false }
)

function TonConnectUIProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <TonConnectUIProvider
      manifestUrl={
        APP_ENV === "development"
          ? // TON Keeper extension does not load manifest from http://localhost, so we fallback to the demo app
            "https://ton-connect.github.io/demo-dapp-with-wallet/tonconnect-manifest.json"
          : "https://new.near-intents.org/tonconnect-manifest.json?_vercel_share=9VN8SMxg8CS8NsQ4dzSTk3Mvjb5cV2Q0"
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
