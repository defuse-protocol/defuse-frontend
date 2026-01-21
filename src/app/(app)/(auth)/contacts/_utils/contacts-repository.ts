import { db } from "@src/utils/drizzle"
import { and, eq, ilike, or } from "drizzle-orm"
import { type Contact, type NewContact, contactsTable } from "./schema"

/**
 * Create a new contact
 */
export async function createContact(contact: NewContact): Promise<Contact> {
  const [newContact] = await db
    .insert(contactsTable)
    .values(contact)
    .returning()
  return newContact
}

/**
 * Get a contact by contactId
 */
export async function getContactById(
  contactId: string
): Promise<Contact | null> {
  const [contact] = await db
    .select()
    .from(contactsTable)
    .where(eq(contactsTable.contactId, contactId))
    .limit(1)
  return contact ?? null
}

/**
 * Get contacts by account_id with optional search
 */
export async function getContactsByAccountId(
  accountId: string,
  search?: string
): Promise<Contact[]> {
  const conditions = [eq(contactsTable.account_id, accountId)]

  if (search?.trim()) {
    const searchPattern = `%${search.trim()}%`
    const searchCondition = or(
      ilike(contactsTable.name, searchPattern),
      ilike(contactsTable.address, searchPattern)
    )
    if (searchCondition) {
      conditions.push(searchCondition)
    }
  }

  return db
    .select()
    .from(contactsTable)
    .where(and(...conditions))
}

/**
 * Get contact by account_id, address, and blockchain
 */
export async function getContactByAccountAddressAndBlockchain(
  accountId: string,
  address: string,
  blockchain: string
): Promise<Contact | null> {
  const [contact] = await db
    .select()
    .from(contactsTable)
    .where(
      and(
        eq(contactsTable.account_id, accountId),
        eq(contactsTable.address, address),
        eq(contactsTable.blockchain, blockchain)
      )
    )
    .limit(1)
  return contact ?? null
}

/**
 * Update a contact by contactId
 */
export async function updateContact(
  contactId: string,
  updates: Partial<
    Pick<Contact, "account_id" | "address" | "name" | "blockchain">
  >
): Promise<Contact | null> {
  const [updatedContact] = await db
    .update(contactsTable)
    .set(updates)
    .where(eq(contactsTable.contactId, contactId))
    .returning()
  return updatedContact ?? null
}

/**
 * Delete a contact by contactId
 */
export async function deleteContact(contactId: string): Promise<void> {
  await db.delete(contactsTable).where(eq(contactsTable.contactId, contactId))
}
