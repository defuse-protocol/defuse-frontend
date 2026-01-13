import type { Intent } from "@defuse-protocol/contract-types"
import type { FeeRecipientSplit } from "./getAppFeeRecipient"

/**
 * Splits appFee BPS (basis points) between recipients.
 * Supports only 1 or 2 recipients (main, or main + domain-specific).
 * Uses rounding strategy: primary gets calculated share, secondary gets remainder to avoid rounding loss.
 *
 * @param appFeeBps - Total fee in basis points
 * @param recipients - Array of 1 or 2 recipients with their share percentages
 * @returns Array of { recipient, fee } objects with BPS values
 */
export function splitAppFeeBps(
  appFeeBps: number,
  recipients: FeeRecipientSplit[]
): Array<{ recipient: string; fee: number }> {
  if (recipients.length === 0) {
    throw new Error("At least one recipient is required")
  }

  if (recipients.length > 2) {
    throw new Error("Only 1 or 2 recipients are supported")
  }

  if (appFeeBps === 0) {
    return []
  }

  const primaryRecipient = recipients[0]
  if (!primaryRecipient) {
    return []
  }

  if (recipients.length === 1) {
    return [
      {
        recipient: primaryRecipient.recipient,
        fee: appFeeBps,
      },
    ]
  }

  const secondaryRecipient = recipients[1]

  // Calculate primary share, secondary gets remainder to avoid rounding loss
  const primaryBps = Math.round((appFeeBps * primaryRecipient.shareBps) / 10000)
  const remainingBps = appFeeBps - primaryBps

  const result: Array<{ recipient: string; fee: number }> = []

  if (primaryBps > 0) {
    result.push({
      recipient: primaryRecipient.recipient,
      fee: primaryBps,
    })
  }

  // Secondary gets all remainder to avoid rounding loss
  if (remainingBps > 0) {
    result.push({
      recipient: secondaryRecipient.recipient,
      fee: remainingBps,
    })
  }

  return result
}

/**
 * Splits appFee amounts between recipients and generates transfer intents for secondary recipients.
 * Supports only 1 or 2 recipients (main, or main + domain-specific).
 *
 * @param appFee - Array of [tokenId, amount] tuples representing fees
 * @param recipients - Array of 1 or 2 recipients with their share percentages
 * @returns Object containing:
 *   - primaryAppFee: appFee array for the primary recipient (first recipient)
 *   - primaryRecipient: the primary recipient address
 *   - transferIntents: array of transfer intents for secondary recipients
 */
export function splitAppFee(
  appFee: [string, bigint][],
  recipients: FeeRecipientSplit[]
): {
  primaryAppFee: [string, bigint][]
  primaryRecipient: string
  transferIntents: Intent[]
} {
  if (recipients.length === 0) {
    throw new Error("At least one recipient is required")
  }

  if (recipients.length > 2) {
    throw new Error("Only 1 or 2 recipients are supported")
  }

  const primaryRecipient = recipients[0]
  if (!primaryRecipient) {
    throw new Error("At least one recipient is required")
  }

  if (recipients.length === 1) {
    return {
      primaryAppFee: appFee,
      primaryRecipient: primaryRecipient.recipient,
      transferIntents: [],
    }
  }

  const secondaryRecipient = recipients[1]

  // Split fees: primary gets calculated share, secondary gets remainder
  const primaryAppFee: [string, bigint][] = []
  const transferIntents: Intent[] = []
  let secondaryIntent:
    | {
        intent: "transfer"
        receiver_id: string
        tokens: Record<string, string>
      }
    | undefined

  for (const [tokenId, totalFeeAmount] of appFee) {
    // Calculate split: primary gets calculated share, secondary gets remainder
    // This ensures we don't lose 1 yocto due to integer division
    const primaryAmount =
      (totalFeeAmount * BigInt(primaryRecipient.shareBps)) / 10000n
    const remainingAmount = totalFeeAmount - primaryAmount

    if (primaryAmount > 0n) {
      primaryAppFee.push([tokenId, primaryAmount])
    }

    if (remainingAmount > 0n) {
      if (!secondaryIntent) {
        secondaryIntent = {
          intent: "transfer",
          receiver_id: secondaryRecipient.recipient,
          tokens: {},
        }
        transferIntents.push(secondaryIntent)
      }

      const currentAmount = BigInt(secondaryIntent.tokens[tokenId] || "0")
      secondaryIntent.tokens[tokenId] = (
        currentAmount + remainingAmount
      ).toString()
    }
  }

  return {
    primaryAppFee,
    primaryRecipient: primaryRecipient.recipient,
    transferIntents,
  }
}
