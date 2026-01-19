"use server"

import {
  createContact as createContactRepo,
  deleteContact as deleteContactRepo,
  getContactByAccountAddressAndNetwork,
  getContactById,
  getContactsByAccountId,
  updateContact as updateContactRepo,
} from "@src/app/(app)/(auth)/contacts/_utils/contacts-repository"
import type {
  Contact,
  NewContact,
} from "@src/app/(app)/(auth)/contacts/_utils/schema"
import { logger } from "@src/utils/logger"
import { Err, Ok, type Result } from "@thames/monads"
import { z } from "zod"

const getContactsInputSchema = z.object({
  account_id: z.string().min(1, "account_id is required"),
})

const createContactInputSchema = z.object({
  account_id: z.string().min(1, "account_id is required"),
  address: z.string().min(1, "address is required"),
  name: z.string().min(1, "name is required"),
  network: z.string().min(1, "network is required"),
})

const updateContactInputSchema = z.object({
  account_id: z.string().min(1, "account_id is required"),
  contactId: z.string().uuid("contactId must be a valid UUID"),
  address: z.string().min(1, "address is required"),
  name: z.string().min(1, "name is required"),
  network: z.string().min(1, "network is required"),
})

const deleteContactInputSchema = z.object({
  contactId: z.string().uuid("contactId must be a valid UUID"),
})

export async function getContacts(
  account_id: string
): Promise<Result<Contact[], string>> {
  try {
    const validatedData = getContactsInputSchema.parse({ account_id })

    const contacts = await getContactsByAccountId(validatedData.account_id)
    return Ok(contacts)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return Err(firstError?.message || "Invalid request format.")
    }

    logger.warn("Failed to fetch contacts", {
      cause: error,
      account_id,
    })
    return Err("Failed to fetch contacts. Please try again.")
  }
}

export async function createContact(
  contact: Pick<Contact, "account_id" | "address" | "name" | "network">
): Promise<Result<Contact, string>> {
  try {
    const validatedData = createContactInputSchema.parse(contact)

    // Check if contact already exists
    const existingContact = await getContactByAccountAddressAndNetwork(
      validatedData.account_id,
      validatedData.address,
      validatedData.network
    )

    if (existingContact) {
      return Err("This contact already exists.")
    }

    const newContact = await createContactRepo(validatedData as NewContact)
    return Ok(newContact)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return Err(firstError?.message || "Invalid contact format.")
    }

    if ((error as { code?: string })?.code === "23505") {
      return Err("This contact already exists.")
    }

    logger.warn("Failed to create contact", {
      cause: error,
      contact,
    })
    return Err("Failed to create contact. Please try again.")
  }
}

export async function updateContact(
  contact: Pick<
    Contact,
    "account_id" | "contactId" | "address" | "name" | "network"
  >
): Promise<Result<Contact, string>> {
  try {
    const validatedData = updateContactInputSchema.parse(contact)

    // Check if contact exists and belongs to the account
    const existingContact = await getContactById(validatedData.contactId)

    if (!existingContact) {
      return Err("Contact not found.")
    }

    if (existingContact.account_id !== validatedData.account_id) {
      return Err("You don't have permission to update this contact.")
    }

    const updatedContact = await updateContactRepo(validatedData.contactId, {
      address: validatedData.address,
      name: validatedData.name,
      network: validatedData.network,
    })

    if (!updatedContact) {
      return Err("Failed to update contact.")
    }

    return Ok(updatedContact)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return Err(firstError?.message || "Invalid contact format.")
    }

    logger.warn("Failed to update contact", {
      cause: error,
      contact,
    })
    return Err("Failed to update contact. Please try again.")
  }
}

export async function deleteContact(
  contact: Pick<Contact, "contactId">
): Promise<Result<null, string>> {
  try {
    const validatedData = deleteContactInputSchema.parse(contact)

    // Check if contact exists
    const existingContact = await getContactById(validatedData.contactId)

    if (!existingContact) {
      return Err("Contact not found.")
    }

    await deleteContactRepo(validatedData.contactId)
    return Ok(null)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return Err(firstError?.message || "Invalid contact ID format.")
    }

    logger.warn("Failed to delete contact", {
      cause: error,
      contact,
    })
    return Err("Failed to delete contact. Please try again.")
  }
}
