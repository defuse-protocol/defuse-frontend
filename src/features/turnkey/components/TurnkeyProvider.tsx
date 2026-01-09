"use client"

import {
  type TurnkeyProviderConfig,
  TurnkeyProvider as TurnkeyWalletKitProvider,
} from "@turnkey/react-wallet-kit"
import type { ReactNode } from "react"

const config: TurnkeyProviderConfig = {
  organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID ?? "",
  authProxyConfigId: process.env.NEXT_PUBLIC_AUTH_PROXY_CONFIG_ID ?? "",
}

export function TurnkeyProvider({ children }: { children: ReactNode }) {
  return (
    <TurnkeyWalletKitProvider config={config}>
      {children}
    </TurnkeyWalletKitProvider>
  )
}
