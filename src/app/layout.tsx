import { GoogleAnalytics } from "@next/third-parties/google"
import Helpscout from "@src/components/Helpscout"
import { whitelabelTemplateFlag } from "@src/config/featureFlags"
import { Figtree } from "next/font/google"
import type { ReactNode } from "react"
import "../styles/global.css"
import { settings } from "@src/config/settings"
import {
  HELPSCOUT_BEACON_ID,
  VERCEL_PROJECT_PRODUCTION_URL,
} from "@src/utils/environment"
import type { Metadata, Viewport } from "next"

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
    openGraph: {
      title: settings.metadata.home.title,
      description: settings.metadata.home.description,
      url: VERCEL_PROJECT_PRODUCTION_URL?.toString() ?? "",
      siteName: settings.appName,
      images: [
        {
          url: `/favicons/${templ}/og-image.png`,
          width: 1200,
          height: 630,
        },
      ],
    },
    icons: {
      icon: [
        {
          url: `/favicons/${templ}/favicon-16x16.png`,
          sizes: "16x16",
          type: "image/png",
        },
        {
          url: `/favicons/${templ}/favicon-32x32.png`,
          sizes: "32x32",
          type: "image/png",
        },
      ],
      shortcut: `/favicons/${templ}/favicon.ico`,
      apple: {
        url: `/favicons/${templ}/apple-touch-icon.png`,
        sizes: "180x180",
        type: "image/png",
      },
    },
    manifest: `/favicons/${templ}/site.webmanifest`,
    ...metadata,
  }
}

const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-figtree",
})

const RootLayout = async ({
  children,
}: Readonly<{
  children?: ReactNode
}>) => {
  const tmpl = await whitelabelTemplateFlag()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`text-fg bg-sidebar-bg antialiased tmpl-${tmpl} ${figtree.variable}`}
    >
      <body className={figtree.className}>{children}</body>
      <GoogleAnalytics gaId="G-WNE3NB46KM" />
      {HELPSCOUT_BEACON_ID && <Helpscout />}
    </html>
  )
}

export default RootLayout
