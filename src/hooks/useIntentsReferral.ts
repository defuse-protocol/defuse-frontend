import type { WhitelabelTemplateValue } from "@src/config/featureFlags"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import { useContext } from "react"

const referralMap: Record<WhitelabelTemplateValue, string> = {
  "near-intents": "near-intents.intents-referral.near",
  solswap: "solswap.intents-referral.near",
  dogecoinswap: "dogecoinswap.intents-referral.near",
  turboswap: "turboswap.intents-referral.near",
  trumpswap: "trumpswap.intents-referral.near",
}

export function useIntentsReferral() {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)
  return referralMap[whitelabelTemplate]
}
