import { db } from "@src/utils/drizzle"
import { and, eq } from "drizzle-orm"
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
 * Get contacts by account_id
 */
export async function getContactsByAccountId(
  accountId: string
): Promise<Contact[]> {
  return db
    .select()
    .from(contactsTable)
    .where(eq(contactsTable.account_id, accountId))
}

/**
 * Get contact by account_id, address, and network
 */
export async function getContactByAccountAddressAndNetwork(
  accountId: string,
  address: string,
  network: string
): Promise<Contact | null> {
  const [contact] = await db
    .select()
    .from(contactsTable)
    .where(
      and(
        eq(contactsTable.account_id, accountId),
        eq(contactsTable.address, address),
        eq(contactsTable.network, network)
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
  updates: Partial<Pick<Contact, "account_id" | "address" | "name" | "network">>
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
