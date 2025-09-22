import type { WhitelabelTemplateValue } from "@src/config/featureFlags"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import { useContext } from "react"
import { useIs1CsEnabled } from "./useIs1CsEnabled"

export const referralMap: Record<WhitelabelTemplateValue, string> = {
  "near-intents": "near-intents.intents-referral.near",
  solswap: "solswap.intents-referral.near",
  dogecoinswap: "dogecoinswap.intents-referral.near",
  turboswap: "turboswap.intents-referral.near",
  trumpswap: "trumpswap.intents-referral.near",
}

export function useIntentsReferral() {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)
  const is1cs = useIs1CsEnabled()
  const referral = referralMap[whitelabelTemplate]
  return is1cs ? `1click-${referral}` : referral
}
