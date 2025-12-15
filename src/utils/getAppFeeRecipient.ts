import type { WhitelabelTemplateValue } from "@src/config/featureFlags"
import { APP_FEE_RECIPIENT, APP_FEE_RECIPIENT_RABITSWAP } from "./environment"

export function getAppFeeRecipient(template: WhitelabelTemplateValue): string {
  if (template === "rabitswap" && APP_FEE_RECIPIENT_RABITSWAP) {
    return APP_FEE_RECIPIENT_RABITSWAP
  }
  return APP_FEE_RECIPIENT
}
