import { evaluate } from "@vercel/flags/next"
import type { ReactNode } from "react"

import {
  type WhitelabelTemplateValue,
  whitelabelTemplateFlag,
} from "@src/config/featureFlags"
import { FeatureFlagsProvider } from "@src/providers/FeatureFlagsProvider"

export async function PreloadFeatureFlags({
  children,
}: {
  children: ReactNode
}) {
  const flags = await getEvaluatedFeatureFlags()

  return <FeatureFlagsProvider flags={flags}>{children}</FeatureFlagsProvider>
}

async function getEvaluatedFeatureFlags(): Promise<FeatureFlagValues> {
  const flags = [whitelabelTemplateFlag] as const
  const [whitelabelTemplate_] = await evaluate(flags)
  const whitelabelTemplate = whitelabelTemplate_ as WhitelabelTemplateValue
  return { whitelabelTemplate }
}

export interface FeatureFlagValues {
  whitelabelTemplate: WhitelabelTemplateValue
}
