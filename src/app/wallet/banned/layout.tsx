import { PreloadFeatureFlags } from "@src/components/PreloadFeatureFlags"
import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Wallet Address Blocked",
}

export default function BannedWalletLayout({
  children,
}: {
  children: ReactNode
}) {
  return <PreloadFeatureFlags>{children}</PreloadFeatureFlags>
}
