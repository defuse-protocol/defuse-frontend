import Layout from "@src/components/Layout"
import { PreloadFeatureFlags } from "@src/components/PreloadFeatureFlags"
import { settings } from "@src/config/settings"
import type { Metadata } from "next"
import type { ReactNode } from "react"

export function generateMetadata(): Metadata {
  return settings.metadata.account
}

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <PreloadFeatureFlags>
      <Layout>{children}</Layout>
    </PreloadFeatureFlags>
  )
}
