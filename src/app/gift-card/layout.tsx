import Layout from "@src/components/Layout"
import { PreloadFeatureFlags } from "@src/components/PreloadFeatureFlags"
import type React from "react"
import type { PropsWithChildren } from "react"

const GiftCardLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <PreloadFeatureFlags>
      <Layout>{children}</Layout>
    </PreloadFeatureFlags>
  )
}

export default GiftCardLayout
