import { CommandLineIcon } from "@heroicons/react/16/solid"
import { getCachedSystemStatus } from "@src/actions/systemStatus"
import Button from "@src/components/Button"
import { whitelabelTemplateFlag } from "@src/config/featureFlags"
import { DiscordIcon, NearIntentsLogoIcon, TwitterIcon } from "@src/icons"
import { SystemStatusProvider } from "@src/providers/SystemStatusProvider"
import { VERCEL_PROJECT_PRODUCTION_URL } from "@src/utils/environment"
import type { Metadata, Viewport } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

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

const socialLinks = [
  {
    name: "X.com",
    icon: TwitterIcon,
    link: "https://x.com/near_intents",
  },
  {
    name: "Discord",
    icon: DiscordIcon,
    link: "https://discord.gg/rdGAgDRs",
  },
  {
    name: "Docs",
    icon: CommandLineIcon,
    link: "https://docs.near-intents.org",
  },
]

const additionalLinks = [
  {
    name: "Terms",
    link: "/terms",
  },
  {
    name: "Privacy",
    link: "/privacy",
  },
]

const RootLayout = async ({
  children,
}: Readonly<{
  children?: ReactNode
}>) => {
  const systemStatus = await getCachedSystemStatus()

  return (
    <SystemStatusProvider systemStatus={systemStatus}>
      <div className="p-2 flex flex-col bg-gray-800 min-h-screen">
        <header className="bg-white rounded-t-3xl flex justify-center items-center py-5">
          <div className="flex items-center justify-between w-full max-w-5xl px-4">
            <Link href="/" className="shrink-0">
              <span className="sr-only">Home</span>
              <NearIntentsLogoIcon className="h-4" />
            </Link>
            <Button href="/login">Sign up or Sign in</Button>
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          {children}
          <div className="flex-1 bg-white" />
        </main>

        <footer className="bg-white pb-16 flex justify-center items-center rounded-b-3xl">
          <div className="flex w-full flex-col px-4 max-w-5xl">
            <div className="pt-16">
              <div className="flex items-center justify-between pb-8">
                <NearIntentsLogoIcon className="h-4 shrink-0" />

                <div className="flex items-center justify-end gap-2">
                  {socialLinks.map(({ name, icon: Icon, link }) => (
                    <Button
                      key={name}
                      variant="secondary"
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon className="size-4 shrink-0" />
                      {name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-8">
                <div className="flex items-center justify-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1.5 border border-gray-200">
                  <span className="text-gray-900 text-xs/none font-semibold">
                    Powered by
                  </span>
                  <span className="sr-only">Near</span>
                  <NearIntentsLogoIcon className="h-3 shrink-0" aria-hidden />
                </div>
                <div className="flex items-center justify-end gap-4">
                  {additionalLinks.map(({ name, link }) => (
                    <Link
                      key={name}
                      href={link}
                      className="text-sm/5 font-medium text-gray-500 hover:underline hover:text-gray-900"
                    >
                      {name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </SystemStatusProvider>
  )
}

export default RootLayout
