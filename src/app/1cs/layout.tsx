import type { Metadata } from "next"
import type React from "react"
import type { PropsWithChildren } from "react"

import Layout from "@src/components/Layout"
import { PreloadFeatureFlags } from "@src/components/PreloadFeatureFlags"
import { whitelabelTemplateFlag } from "@src/config/featureFlags"
import { settings } from "@src/config/settings"

export async function generateMetadata(): Promise<Metadata> {
  const templ = await whitelabelTemplateFlag()

  if (templ !== "dogecoinswap") {
    return settings.metadata.home
  }

  return {}
}

const SwapLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <PreloadFeatureFlags>
      <Layout>{children}</Layout>
    </PreloadFeatureFlags>
  )
}

export default SwapLayout
