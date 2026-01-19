import Layout from "@src/components/Layout"
import { PreloadFeatureFlags } from "@src/components/PreloadFeatureFlags"
import type { Metadata } from "next"
import type { ReactNode } from "react"

export function generateMetadata(): Metadata {
  return {
    title: "Transaction History | NEAR Intents",
    description: "View your transaction history on NEAR Intents",
  }
}

export default function HistoryLayout({ children }: { children: ReactNode }) {
  return (
    <PreloadFeatureFlags>
      <Layout>{children}</Layout>
    </PreloadFeatureFlags>
  )
}
