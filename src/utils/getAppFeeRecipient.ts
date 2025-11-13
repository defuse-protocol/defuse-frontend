import type { WhitelabelTemplateValue } from "@src/config/featureFlags"
import { APP_FEE_RECIPIENT, APP_FEE_RECIPIENT_RABITSWAP } from "./environment"

export function getAppFeeRecipient(template: WhitelabelTemplateValue): string {
  if (template === "rabitswap") {
    return APP_FEE_RECIPIENT_RABITSWAP ?? APP_FEE_RECIPIENT
  }
  return APP_FEE_RECIPIENT
}
