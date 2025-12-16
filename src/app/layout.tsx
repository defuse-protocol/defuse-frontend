import { GoogleAnalytics } from "@next/third-parties/google"
import Helpscout from "@src/components/Helpscout"
import { whitelabelTemplateFlag } from "@src/config/featureFlags"
import { HELPSCOUT_BEACON_ID } from "@src/utils/environment"
import localFont from "next/font/local"
import type { ReactNode } from "react"

const circularFont = localFont({
  src: [
    {
      path: "../../public/static/fonts/CircularXXSub-Book.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/static/fonts/CircularXXSub-Book.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/static/fonts/CircularXXSub-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/static/fonts/CircularXXSub-Medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/static/fonts/CircularXXSub-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/static/fonts/CircularXXSub-Bold.woff",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/static/fonts/CircularXXSub-Black.woff2",
      weight: "900",
      style: "normal",
    },
    {
      path: "../../public/static/fonts/CircularXXSub-Black.woff",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-circular",
  display: "swap",
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
      className={`tmpl-${tmpl} ${circularFont.variable}`}
    >
      <body className={circularFont.className}>{children}</body>
      <GoogleAnalytics gaId="G-WNE3NB46KM" />
      {HELPSCOUT_BEACON_ID && <Helpscout />}
    </html>
  )
}

export default RootLayout
