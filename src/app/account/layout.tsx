import { PreloadFeatureFlags } from "@src/components/PreloadFeatureFlags"
import type { ReactNode } from "react"

import Layout from "@src/components/Layout"

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <PreloadFeatureFlags>
      <Layout>{children}</Layout>
    </PreloadFeatureFlags>
  )
}
