import { unstable_evaluate as evaluate } from "@vercel/flags/next"
import type { ReactNode } from "react"

import { enableDogecoin } from "@src/config/featureFlags"
import { FeatureFlagsProvider } from "@src/providers/FeatureFlagsProvider"

export async function PreloadFeatureFlags({
  children,
}: { children: ReactNode }) {
  const flags = await getEvaluatedFeatureFlags()

  return <FeatureFlagsProvider flags={flags}>{children}</FeatureFlagsProvider>
}

async function getEvaluatedFeatureFlags(): Promise<FeatureFlagValues> {
  const flags = [enableDogecoin]
  const [dogecoin] = await evaluate(flags)
  return { dogecoin }
}

export interface FeatureFlagValues {
  dogecoin: boolean
}
