import { GoogleAnalytics } from "@next/third-parties/google"
import Helpscout from "@src/components/Helpscout"
import { whitelabelTemplateFlag } from "@src/config/featureFlags"
import { HELPSCOUT_BEACON_ID } from "@src/utils/environment"
import { Figtree } from "next/font/google"
import type { ReactNode } from "react"

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
      className={`tmpl-${tmpl} ${figtree.variable}`}
    >
      <body className={figtree.className}>{children}</body>
      <GoogleAnalytics gaId="G-WNE3NB46KM" />
      {HELPSCOUT_BEACON_ID && <Helpscout />}
    </html>
  )
}

export default RootLayout
