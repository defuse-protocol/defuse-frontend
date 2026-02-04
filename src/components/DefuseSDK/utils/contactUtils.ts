import type { BlockchainEnum } from "@defuse-protocol/internal-utils"
import type { Contact } from "@src/app/(app)/(auth)/contacts/actions"

export function findContactByAddress(
  contacts: Contact[],
  address: string | null | undefined,
  blockchain?: BlockchainEnum | null
): Contact | undefined {
  if (!address) return undefined
  const normalizedAddress = address.toLowerCase()
  return contacts.find(
    (contact) =>
      contact.address.toLowerCase() === normalizedAddress &&
      (blockchain == null || contact.blockchain === blockchain)
  )
}
