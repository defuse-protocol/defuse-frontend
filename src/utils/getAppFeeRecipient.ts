import type { WhitelabelTemplateValue } from "@src/config/featureFlags"
import { APP_FEE_RECIPIENT, APP_FEE_RECIPIENT_RABITSWAP } from "./environment"

export type FeeRecipientSplit = {
  recipient: string
  shareBps: number // share in basis points (out of 10_000)
}

function getWhitelabelTemplateToRecipient(): Partial<
  Record<WhitelabelTemplateValue, string>
> {
  return {
    rabitswap: APP_FEE_RECIPIENT_RABITSWAP,
    // Add more templates here as needed:
    // solswap: APP_FEE_RECIPIENT_SOLSWAP,
    // etc.
  }
}

/**
 * Returns fee recipients with their share percentages.
 * 50/50 split if both exist, 100% to available one, empty array if neither exists.
 */
export function getAppFeeRecipients(
  template: WhitelabelTemplateValue
): FeeRecipientSplit[] {
  const main = APP_FEE_RECIPIENT
  const templateSpecific = getWhitelabelTemplateToRecipient()[template]

  const hasMain = main && main.trim() !== ""
  const hasTemplateSpecific = templateSpecific && templateSpecific.trim() !== ""

  if (hasTemplateSpecific && hasMain) {
    return [
      { recipient: main, shareBps: 5000 },
      { recipient: templateSpecific, shareBps: 5000 },
    ]
  }

  if (hasTemplateSpecific) {
    return [{ recipient: templateSpecific, shareBps: 10000 }]
  }

  if (hasMain) {
    return [{ recipient: main, shareBps: 10000 }]
  }

  return []
}
