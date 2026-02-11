import { evaluate } from "@vercel/flags/next"
import type { ReactNode } from "react"

import {
  type WhitelabelTemplateValue,
  dealsDisabledFlag,
  depositsDisabledFlag,
  earnDisabledFlag,
  swapDisabledFlag,
  whitelabelTemplateFlag,
  withdrawDisabledFlag,
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
  const flags = [
    whitelabelTemplateFlag,
    swapDisabledFlag,
    depositsDisabledFlag,
    withdrawDisabledFlag,
    dealsDisabledFlag,
    earnDisabledFlag,
  ] as const
  const [
    whitelabelTemplate_,
    isSwapDisabled,
    isDepositsDisabled,
    isWithdrawDisabled,
    isDealsDisabled,
    isEarnDisabled,
  ] = await evaluate(flags)
  const whitelabelTemplate = whitelabelTemplate_ as WhitelabelTemplateValue
  return {
    whitelabelTemplate,
    isSwapDisabled,
    isDepositsDisabled,
    isWithdrawDisabled,
    isDealsDisabled,
    isEarnDisabled,
  }
}

export interface FeatureFlagValues {
  whitelabelTemplate: WhitelabelTemplateValue
  isSwapDisabled: boolean
  isDepositsDisabled: boolean
  isWithdrawDisabled: boolean
  isDealsDisabled: boolean
  isEarnDisabled: boolean
}
