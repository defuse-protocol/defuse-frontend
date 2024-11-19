"use client"

import { SwapWidgetProvider } from "@defuse-protocol/defuse-sdk"
import { GoogleAnalytics } from "@next/third-parties/google"
import { Theme } from "@radix-ui/themes"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ThemeProvider } from "next-themes"
import { useEffect } from "react"

import Modal from "@src/components/Modal"
import queryClient from "@src/constants/queryClient"
import { HistoryStoreProvider } from "@src/providers/HistoryStoreProvider"
import { ModalStoreProvider } from "@src/providers/ModalStoreProvider"
import { NotificationStoreProvider } from "@src/providers/NotificationProvider"
import { TokensStoreProvider } from "@src/providers/TokensStoreProvider"
import { WalletSelectorProvider } from "@src/providers/WalletSelectorProvider"
import { WagmiProvider } from "wagmi"
import "@radix-ui/themes/styles.css"
import "@near-wallet-selector/modal-ui/styles.css"
import "@near-wallet-selector/account-export/styles.css"
import "@defuse-protocol/defuse-sdk/styles"
import "../styles/global.scss"
import { SentryTracer } from "@src/components/SentryTracer"
import { config } from "@src/config/wagmi"
import { SolanaWalletProvider } from "@src/providers/SolanaWalletProvider"

const DEV_MODE = process?.env?.NEXT_PUBLIC_DEV_MODE === "true" ?? false
const DARK_MODE_ENABLED =
  process?.env?.NEXT_PUBLIC_DARK_MODE === "true" ?? false

const RootLayout = ({
  children,
}: Readonly<{
  children?: React.ReactNode
}>) => {
  // CONTEXT: Could be used to share global concerns, theme
  //          like the current theme etc.
  useEffect(() => {
    localStorage.setItem("theme", DARK_MODE_ENABLED ? "dark" : "light")
  }, [])

  return (
    <html lang="en">
      <body>
        <WagmiProvider config={config}>
          <SwapWidgetProvider>
            <NotificationStoreProvider>
              <QueryClientProvider client={queryClient}>
                <WalletSelectorProvider>
                  <SolanaWalletProvider>
                    <ThemeProvider attribute="class">
                      <Theme>
                        <HistoryStoreProvider>
                          <TokensStoreProvider>
                            <ModalStoreProvider>
                              {children}
                              <Modal />
                            </ModalStoreProvider>
                          </TokensStoreProvider>
                        </HistoryStoreProvider>
                      </Theme>
                    </ThemeProvider>
                    <SentryTracer />
                  </SolanaWalletProvider>
                </WalletSelectorProvider>
                {DEV_MODE && <ReactQueryDevtools initialIsOpen={false} />}
              </QueryClientProvider>
            </NotificationStoreProvider>
          </SwapWidgetProvider>
        </WagmiProvider>
      </body>
      <GoogleAnalytics gaId="G-WNE3NB46KM" />
    </html>
  )
}

export default RootLayout
