"use server"

import type { BlockchainEnum } from "@defuse-protocol/internal-utils"
import {
  createContact as createContactRepo,
  deleteContact as deleteContactRepo,
  getContactByAccountAddressAndNetwork,
  getContactById,
  getContactsByAccountId,
  updateContact as updateContactRepo,
} from "@src/app/(app)/(auth)/contacts/_utils/contacts-repository"
import type { Contact as ContactSchema } from "@src/app/(app)/(auth)/contacts/_utils/schema"
import { getAccountIdFromToken } from "@src/utils/dummyAuth"
import { logger } from "@src/utils/logger"
import { cookies } from "next/headers"
import * as v from "valibot"

type ActionResult<T> = { ok: true; value: T } | { ok: false; error: string }

const AUTH_TOKEN_KEY = "defuse_auth_token"

const CreateContactFormSchema = v.object({
  address: v.pipe(v.string(), v.nonEmpty("Address is required")),
  name: v.pipe(v.string(), v.nonEmpty("Name is required")),
  network: v.pipe(v.string(), v.nonEmpty("Network is required")),
})

const UpdateContactFormSchema = v.object({
  contactId: v.pipe(v.string(), v.uuid("Contact ID must be a valid UUID")),
  address: v.pipe(v.string(), v.nonEmpty("Address is required")),
  name: v.pipe(v.string(), v.nonEmpty("Name is required")),
  network: v.pipe(v.string(), v.nonEmpty("Network is required")),
})

const DeleteContactFormSchema = v.object({
  contactId: v.pipe(v.string(), v.uuid("Contact ID must be a valid UUID")),
})

export type Contact = Omit<
  ContactSchema,
  "createdAt" | "updatedAt" | "network"
> & {
  id: string
  network: BlockchainEnum
}

type ContactEntity = {
  id: string
  contactId: string
  account_id: string
  address: string
  name: string
  network: string
}

export async function getContacts(input?: {
  search: string | undefined
}): Promise<ActionResult<Array<Contact>>> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(AUTH_TOKEN_KEY)?.value

    if (!token) {
      logger.warn("Auth token missing from cookies")
      return { ok: false, error: "Authentication required" }
    }

    const account_id = getAccountIdFromToken(token)
    if (!account_id) {
      return { ok: false, error: "Invalid token" }
    }

    const contactsData = await getContactsByAccountId(account_id, input?.search)

    const contacts: Array<Contact> = contactsData.map((contact) => ({
      contactId: contact.contactId,
      account_id: contact.account_id,
      address: contact.address,
      name: contact.name,
      network: contact.network as BlockchainEnum,
      id: contact.contactId,
    }))

    return { ok: true, value: contacts }
  } catch (error) {
    logger.error("Failed to fetch contacts", { cause: error })
    return { ok: false, error: "Failed to fetch contacts" }
  }
}

export async function createContact(input: {
  name: string
  address: string
  network: string
}): Promise<ActionResult<ContactEntity>> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_TOKEN_KEY)?.value

  if (!token) {
    logger.warn("Auth token missing from cookies", {
      source: "create-contact",
      action: "missing-token",
    })
    return { ok: false, error: "Authentication required" }
  }

  const account_id = getAccountIdFromToken(token)
  if (!account_id) {
    logger.warn("Invalid token when creating contact", {
      source: "create-contact",
      action: "invalid-token",
    })
    return { ok: false, error: "Invalid token" }
  }

  const data = v.safeParse(CreateContactFormSchema, input)

  if (!data.success) {
    logger.warn("Contact creation validation failed", {
      source: "create-contact",
      action: "validation-error",
      issues: data.issues,
    })
    const flattened = v.flatten(data.issues)
    const errorMessage =
      typeof flattened === "string"
        ? flattened
        : flattened.root?.[0] || "Validation failed"
    return { ok: false, error: errorMessage }
  }

  const existingContact = await getContactByAccountAddressAndNetwork(
    account_id,
    data.output.address,
    data.output.network
  )

  if (existingContact) {
    logger.warn("Contact already exists", {
      source: "create-contact",
      action: "duplicate-contact",
      account_id,
      address: data.output.address,
      network: data.output.network,
    })
    return { ok: false, error: "Contact already exists" }
  }

  const entity = await createContactRepo({
    account_id,
    address: data.output.address,
    name: data.output.name,
    network: data.output.network,
  })

  if (!entity) {
    logger.error("Failed to create contact in repository", {
      source: "create-contact",
      action: "repository-error",
      account_id,
    })
    return { ok: false, error: "Failed to create contact" }
  }

  return {
    ok: true,
    value: {
      id: entity.contactId,
      contactId: entity.contactId,
      account_id: entity.account_id,
      address: entity.address,
      name: entity.name,
      network: entity.network,
    },
  }
}

export async function updateContact(input: {
  contactId: string
  name: string
  address: string
  network: string
}): Promise<ActionResult<ContactEntity>> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_TOKEN_KEY)?.value

  if (!token) {
    logger.warn("Auth token missing from cookies", {
      source: "update-contact",
      action: "missing-token",
    })
    return { ok: false, error: "Authentication required" }
  }

  const account_id = getAccountIdFromToken(token)
  if (!account_id) {
    logger.warn("Invalid token when updating contact", {
      source: "update-contact",
      action: "invalid-token",
    })
    return { ok: false, error: "Invalid token" }
  }

  const data = v.safeParse(UpdateContactFormSchema, input)

  if (!data.success) {
    logger.warn("Contact update validation failed", {
      source: "update-contact",
      action: "validation-error",
      issues: data.issues,
    })
    const flattened = v.flatten(data.issues)
    const errorMessage =
      typeof flattened === "string"
        ? flattened
        : flattened.root?.[0] || "Validation failed"
    return { ok: false, error: errorMessage }
  }

  // Check if contact exists and belongs to the account
  const existingContact = await getContactById(data.output.contactId)

  if (!existingContact) {
    logger.warn("Contact not found when updating", {
      source: "update-contact",
      action: "contact-not-found",
      contactId: data.output.contactId,
      account_id,
    })
    return { ok: false, error: "Contact not found" }
  }

  if (existingContact.account_id !== account_id) {
    logger.error("Unauthorized attempt to update contact", {
      source: "update-contact",
      action: "permission-denied",
      contactId: data.output.contactId,
      account_id,
      contactAccountId: existingContact.account_id,
    })
    return { ok: false, error: "Permission denied" }
  }

  const updatedContact = await updateContactRepo(data.output.contactId, {
    address: data.output.address,
    name: data.output.name,
    network: data.output.network,
  })

  if (!updatedContact) {
    logger.error("Failed to update contact in repository", {
      source: "update-contact",
      action: "repository-error",
      contactId: data.output.contactId,
      account_id,
    })
    return { ok: false, error: "Failed to update contact" }
  }

  return {
    ok: true,
    value: {
      id: updatedContact.contactId,
      contactId: updatedContact.contactId,
      account_id: updatedContact.account_id,
      address: updatedContact.address,
      name: updatedContact.name,
      network: updatedContact.network,
    },
  }
}

export async function deleteContact(input: {
  contactId: string
}): Promise<ActionResult<null>> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_TOKEN_KEY)?.value

  if (!token) {
    logger.warn("Auth token missing from cookies", {
      source: "delete-contact",
      action: "missing-token",
    })
    return { ok: false, error: "Authentication required" }
  }

  const account_id = getAccountIdFromToken(token)
  if (!account_id) {
    logger.warn("Invalid token when deleting contact", {
      source: "delete-contact",
      action: "invalid-token",
    })
    return { ok: false, error: "Invalid token" }
  }

  const data = v.safeParse(DeleteContactFormSchema, input)

  if (!data.success) {
    logger.warn("Contact deletion validation failed", {
      source: "delete-contact",
      action: "validation-error",
      issues: data.issues,
    })
    const flattened = v.flatten(data.issues)
    const errorMessage =
      typeof flattened === "string"
        ? flattened
        : flattened.root?.[0] || "Validation failed"
    return { ok: false, error: errorMessage }
  }

  // Check if contact exists and belongs to the account
  const existingContact = await getContactById(data.output.contactId)

  if (!existingContact) {
    logger.warn("Contact not found when deleting", {
      source: "delete-contact",
      action: "contact-not-found",
      contactId: data.output.contactId,
      account_id,
    })
    return { ok: false, error: "Contact not found" }
  }

  if (existingContact.account_id !== account_id) {
    logger.error("Unauthorized attempt to delete contact", {
      source: "delete-contact",
      action: "permission-denied",
      contactId: data.output.contactId,
      account_id,
      contactAccountId: existingContact.account_id,
    })
    return { ok: false, error: "Permission denied" }
  }

  await deleteContactRepo(data.output.contactId)

  return { ok: true, value: null }
}
