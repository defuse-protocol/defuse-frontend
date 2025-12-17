import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { WagmiProvider } from "wagmi"

import { UserIcon } from "@heroicons/react/24/solid"
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

import "../../styles/global.css"
import { getCachedSystemStatus } from "@src/actions/systemStatus"
import { NavbarDesktop } from "@src/components/Navbar/NavbarDesktop"
import { PreloadFeatureFlags } from "@src/components/PreloadFeatureFlags"
import { MixpanelProvider } from "@src/providers/MixpanelProvider"
import { NearWalletProvider } from "@src/providers/NearWalletProvider"
import { SystemStatusProvider } from "@src/providers/SystemStatusProvider"
import { TronWalletProvider } from "@src/providers/TronWalletProvider"
import { APP_ENV, VERCEL_PROJECT_PRODUCTION_URL } from "@src/utils/environment"

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
  } else if (templ === "rabitswap") {
    Object.assign(metadata, {
      title: "RabitSwap: The Rabbit Hole of Swaps",
      description: "Fast, easy cross-chain swaps and more with RabitSwap.",
      openGraph: {
        type: "website",
        images: `/favicons/${templ}/og-image.jpg`,
      },
      twitter: {
        images: `/favicons/${templ}/og-image.jpg`,
        title: "RabitSwap: The Rabbit Hole of Swaps",
        description: "Fast, easy cross-chain swaps and more with RabitSwap.",
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

const AppRootLayout = async ({
  children,
}: Readonly<{
  children?: ReactNode
}>) => {
  initSDK()
  const systemStatus = await getCachedSystemStatus()

  return (
    <>
      <InitDefuseSDK />

      <ThemeProvider>
        <SystemStatusProvider systemStatus={systemStatus}>
          <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
              <NearWalletProvider>
                <SolanaWalletProvider>
                  <StellarWalletProvider>
                    <TonConnectUIProvider>
                      <TronWalletProvider>
                        <WebAuthnProvider>
                          <MixpanelProvider>
                            <PreloadFeatureFlags>
                              <div className="relative isolate flex min-h-svh w-full bg-gray-25 lg:bg-gray-800">
                                {/* Sidebar on desktop */}
                                <div className="fixed inset-y-0 left-0 w-72 max-lg:hidden py-6 px-4">
                                  <div className="bg-gray-900 rounded-2xl p-2 flex items-center gap-3">
                                    <div className="size-8 flex items-center justify-center bg-orange-500 rounded-lg">
                                      <UserIcon className="text-orange-100 size-5" />
                                    </div>
                                    <div className="text-gray-400 text-sm font-medium">
                                      @username123
                                    </div>
                                  </div>

                                  <div className="my-6 border-t border-gray-700" />

                                  <NavbarDesktop />
                                </div>

                                {/* Content */}
                                <main className="flex flex-1 flex-col pb-2 lg:min-w-0 lg:pt-2 lg:pr-2 lg:pl-72">
                                  <div className="grow p-6 lg:rounded-3xl lg:bg-gray-25 lg:p-10">
                                    <div className="mx-auto max-w-[464px]">
                                      {children}
                                    </div>
                                  </div>
                                </main>
                              </div>
                            </PreloadFeatureFlags>
                          </MixpanelProvider>
                        </WebAuthnProvider>
                        <SentryTracer />
                      </TronWalletProvider>
                    </TonConnectUIProvider>
                  </StellarWalletProvider>
                </SolanaWalletProvider>
              </NearWalletProvider>
              {APP_ENV === "development" && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </QueryClientProvider>
          </WagmiProvider>
        </SystemStatusProvider>
      </ThemeProvider>
    </>
  )
}

export default AppRootLayout
