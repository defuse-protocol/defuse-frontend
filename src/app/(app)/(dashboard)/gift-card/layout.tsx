import { PreloadFeatureFlags } from "@src/components/PreloadFeatureFlags"
import type { ReactNode } from "react"

export default function GiftCardLayout({ children }: { children: ReactNode }) {
  return <PreloadFeatureFlags>{children}</PreloadFeatureFlags>
}
