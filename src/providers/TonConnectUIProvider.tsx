"use client"

import { TonConnectUIProvider } from "@tonconnect/ui-react"
import type { ReactNode } from "react"

function TonConnectUIProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl="https://ton-connect.github.io/demo-dapp-with-wallet/tonconnect-manifest.json">
      {children}
    </TonConnectUIProvider>
  )
}

export { TonConnectUIProviderWrapper as TonConnectUIProvider }
