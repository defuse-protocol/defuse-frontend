import { GoogleAnalytics } from "@next/third-parties/google"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import { WagmiProvider } from "wagmi"

import Modal from "@src/components/Modal"
import { SentryTracer } from "@src/components/SentryTracer"
import { whitelabelTemplateFlag } from "@src/config/featureFlags"
import { config } from "@src/config/wagmi"
import queryClient from "@src/constants/queryClient"
import { HistoryStoreProvider } from "@src/providers/HistoryStoreProvider"
import { ModalStoreProvider } from "@src/providers/ModalStoreProvider"
import { NotificationStoreProvider } from "@src/providers/NotificationProvider"
import { SolanaWalletProvider } from "@src/providers/SolanaWalletProvider"
import { ThemeProvider } from "@src/providers/ThemeProvider"
import { TokensStoreProvider } from "@src/providers/TokensStoreProvider"
import { WalletSelectorProvider } from "@src/providers/WalletSelectorProvider"

import "@radix-ui/themes/styles.css"
import "@near-wallet-selector/modal-ui/styles.css"
import "@near-wallet-selector/account-export/styles.css"
import "@defuse-protocol/defuse-sdk/styles.css"
import "../styles/global.scss"

const DEV_MODE = process?.env?.NEXT_PUBLIC_DEV_MODE === "true" ?? false

export async function generateMetadata(): Promise<Metadata> {
  const templ = await whitelabelTemplateFlag()

  const metadata: Metadata = {}

  if (templ === "dogecoinswap") {
    Object.assign(metadata, {
      title: "DogecoinSwap: Let Your Meme Coins Run Wild",
      description: "Fast, easy cross-chain swaps for DOGE and more",
      openGraph: {
        type: "website",
        images: `/favicons/${templ}/og-image.jpg`,
        title: "DogecoinSwap: Let Your Meme Coins Run Wild",
        description: "Fast, easy cross-chain swaps for DOGE and more",
      },
      twitter: {
        images: `/favicons/${templ}/og-image.jpg`,
        title: "DogecoinSwap: Let Your Meme Coins Run Wild",
        description: "Fast, easy cross-chain swaps for DOGE and more",
      },
    })
  } else if (templ === "turboswap") {
    Object.assign(metadata, {
      title: "TurboSwap: Revolutionizing Web3 Trading",
      description:
        "Experience zero-fee trading with TurboSwap. Powered by NEAR and Aurora Cloud, TurboSwap delivers unmatched speed and advanced functionality, setting a new standard for decentralized trading in the TURBO ecosystem.",
      openGraph: {
        type: "website",
        images: `/favicons/${templ}/og-image.jpg`,
        title: "TurboSwap: Revolutionizing Web3 Trading",
        description:
          "Experience zero-fee trading with TurboSwap. Powered by NEAR and Aurora Cloud, TurboSwap delivers unmatched speed and advanced functionality, setting a new standard for decentralized trading in the TURBO ecosystem.",
      },
      twitter: {
        images: `/favicons/${templ}/og-image.jpg`,
        title: "TurboSwap: Revolutionizing Web3 Trading",
        description:
          "Experience zero-fee trading with TurboSwap. Powered by NEAR and Aurora Cloud, TurboSwap delivers unmatched speed and advanced functionality, setting a new standard for decentralized trading in the TURBO ecosystem.",
      },
    })
  }

  return {
    metadataBase: process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
      : null,
    icons: {
      icon: `/favicons/${templ}/favicon-32x32.png`,
      apple: `/favicons/${templ}/apple-touch-icon.png`,
    },
    manifest: `/favicons/${templ}/site.webmanifest`,
    ...metadata,
  }
}

const RootLayout = async ({
  children,
}: Readonly<{
  children?: ReactNode
}>) => {
  const tmpl = await whitelabelTemplateFlag()

  return (
    <html lang="en" suppressHydrationWarning className={`tmpl-${tmpl}`}>
      <body>
        <ThemeProvider>
          <WagmiProvider config={config}>
            <NotificationStoreProvider>
              <QueryClientProvider client={queryClient}>
                <WalletSelectorProvider>
                  <SolanaWalletProvider>
                    <HistoryStoreProvider>
                      <TokensStoreProvider>
                        <ModalStoreProvider>
                          {children}
                          <Modal />
                        </ModalStoreProvider>
                      </TokensStoreProvider>
                    </HistoryStoreProvider>

                    <SentryTracer />
                  </SolanaWalletProvider>
                </WalletSelectorProvider>
                {DEV_MODE && <ReactQueryDevtools initialIsOpen={false} />}
              </QueryClientProvider>
            </NotificationStoreProvider>
          </WagmiProvider>
        </ThemeProvider>
      </body>
      <GoogleAnalytics gaId="G-WNE3NB46KM" />
    </html>
  )
}

export default RootLayout
