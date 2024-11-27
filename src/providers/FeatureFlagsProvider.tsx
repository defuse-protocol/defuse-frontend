"use client"

import type { FeatureFlagValues } from "@src/components/PreloadFeatureFlags"
import { type ReactNode, createContext } from "react"

export const FeatureFlagsContext = createContext<FeatureFlagValues>({
  dogecoin: false,
})

export function FeatureFlagsProvider({
  children,
  flags,
}: { children: ReactNode; flags: FeatureFlagValues }) {
  return (
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  )
}
