import Layout from "@src/components/Layout"
import { PreloadFeatureFlags } from "@src/components/PreloadFeatureFlags"
import { settings } from "@src/config/settings"
import type { Metadata } from "next"
import type React from "react"
import type { PropsWithChildren } from "react"

export function generateMetadata(): Metadata {
  return settings.metadata.gift
}

const GiftCardLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <PreloadFeatureFlags>
      <Layout>{children}</Layout>
    </PreloadFeatureFlags>
  )
}

export default GiftCardLayout
