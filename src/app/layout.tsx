import { GoogleAnalytics } from "@next/third-parties/google"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { WagmiProvider } from "wagmi"

import { InitDefuseSDK } from "@src/components/InitDefuseSDK"
import { SentryTracer } from "@src/components/SentryTracer"
import { whitelabelTemplateFlag } from "@src/config/featureFlags"
import { config } from "@src/config/wagmi"
import queryClient from "@src/constants/queryClient"
import { WebAuthnProvider } from "@src/features/webauthn/providers/WebAuthnProvider"
import { initSDK } from "@src/libs/defuse-sdk/initSDK"
import { SolanaWalletProvider } from "@src/providers/SolanaWalletProvider"
import { StellarWalletProvider } from "@src/providers/StellarWalletProvider"
import { ThemeProvider } from "@src/providers/ThemeProvider"
import { TonConnectUIProvider } from "@src/providers/TonConnectUIProvider"
import { WalletSelectorProvider } from "@src/providers/WalletSelectorProvider"

import "@radix-ui/themes/styles.css"
import "@near-wallet-selector/modal-ui/styles.css"
import "../styles/global.scss"
import Helpscout from "@src/components/Helpscout"
import { MixpanelProvider } from "@src/providers/MixpanelProvider"
import {
  DEV_MODE,
  HELPSCOUT_BEACON_ID,
  VERCEL_PROJECT_PRODUCTION_URL,
} from "@src/utils/environment"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

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
  } else if (templ === "trumpswap") {
    Object.assign(metadata, {
      title: "Trump-Swap: Make Swapping Great Again",
      description:
        "Swap $TRUMP directly from BTC, XRP, DOGE and 50+ other cryptocurrencies. Powered by NEAR Intents.",
      openGraph: {
        type: "website",
        images: `/favicons/${templ}/og-image.jpg`,
        title: "Trump-Swap: Make Swapping Great Again",
        description:
          "Swap $TRUMP directly from BTC, XRP, DOGE and 50+ other cryptocurrencies. Powered by NEAR Intents.",
      },
      twitter: {
        images: `/favicons/${templ}/og-image.jpg`,
        title: "Trump-Swap: Make Swapping Great Again",
        description:
          "Swap $TRUMP directly from BTC, XRP, DOGE and 50+ other cryptocurrencies. Powered by NEAR Intents.",
      },
    })
  }

  return {
    metadataBase: VERCEL_PROJECT_PRODUCTION_URL,
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
  initSDK()

  return (
    <html lang="en" suppressHydrationWarning className={`tmpl-${tmpl}`}>
      <body>
        <InitDefuseSDK />

        <ThemeProvider>
          <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
              <WalletSelectorProvider>
                <SolanaWalletProvider>
                  <StellarWalletProvider>
                    <TonConnectUIProvider>
                      <WebAuthnProvider>
                        <MixpanelProvider>{children}</MixpanelProvider>
                      </WebAuthnProvider>
                      <SentryTracer />
                    </TonConnectUIProvider>
                  </StellarWalletProvider>
                </SolanaWalletProvider>
              </WalletSelectorProvider>
              {DEV_MODE && <ReactQueryDevtools initialIsOpen={false} />}
            </QueryClientProvider>
          </WagmiProvider>
        </ThemeProvider>
      </body>
      <GoogleAnalytics gaId="G-WNE3NB46KM" />
      {HELPSCOUT_BEACON_ID && <Helpscout />}
    </html>
  )
}

export default RootLayout
