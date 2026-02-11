import type {
  Contact,
  ContactBlockchain,
} from "@src/app/(app)/(auth)/contacts/actions"

export function findContactByAddress(
  contacts: Contact[],
  address: string | null | undefined,
  blockchain?: ContactBlockchain | null
): Contact | undefined {
  if (!address) return undefined
  const normalizedAddress = address.toLowerCase()
  return contacts.find(
    (contact) =>
      contact.address.toLowerCase() === normalizedAddress &&
      (blockchain == null || contact.blockchain === blockchain)
  )
}
