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
  const { primaryFee, secondaryFee } = splitShareAppFee(
    appFeeBps,
    primaryRecipient.shareBps
  )

  const result: Array<{ recipient: string; fee: number }> = []

  if (primaryFee > 0) {
    result.push({
      recipient: primaryRecipient.recipient,
      fee: primaryFee,
    })
  }

  // Secondary gets all remainder to avoid rounding loss
  if (secondaryFee > 0) {
    result.push({
      recipient: secondaryRecipient.recipient,
      fee: secondaryFee,
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
    const { primaryAmount, secondaryAmount } = splitShareAmount(
      totalFeeAmount,
      primaryRecipient.shareBps
    )

    if (primaryAmount > 0n) {
      primaryAppFee.push([tokenId, primaryAmount])
    }

    if (secondaryAmount > 0n) {
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
        currentAmount + secondaryAmount
      ).toString()
    }
  }

  return {
    primaryAppFee,
    primaryRecipient: primaryRecipient.recipient,
    transferIntents,
  }
}

/**
 * Splits an amount between primary and secondary recipients.
 * Primary gets the calculated share, secondary gets the remainder.
 * This ensures we don't lose 1 yocto for bigint.
 *
 * @param amount - The total amount to split
 * @param shareBps - The primary recipient's share percentage in basis points
 * @returns Object with primary and secondary shares
 */
export function splitShareAmount(
  amount: bigint,
  shareBps: number
): { primaryAmount: bigint; secondaryAmount: bigint } {
  const primaryAmount = (amount * BigInt(shareBps)) / 10000n
  const secondaryAmount = amount - primaryAmount
  return { primaryAmount, secondaryAmount }
}

/**
 * Splits an app fee BPS between primary and secondary recipients.
 * Primary gets the calculated share, secondary gets the remainder.
 * This ensures we don't lose 1 BPS for rounding.
 *
 * @param appFeeBps - The total app fee BPS to split
 * @param shareBps - The primary recipient's share percentage in basis points
 * @returns Object with primary and secondary BPS
 */
export function splitShareAppFee(
  appFeeBps: number,
  shareBps: number
): { primaryFee: number; secondaryFee: number } {
  const primaryFee = Math.round((appFeeBps * shareBps) / 10000)
  const secondaryFee = appFeeBps - primaryFee
  return { primaryFee, secondaryFee }
}
