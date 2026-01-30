"use server"

import type {
  AuthMethod,
  BlockchainEnum,
} from "@defuse-protocol/internal-utils"
import {
  createContact as createContactRepository,
  deleteContact as deleteContactRepository,
  getContactByAccountAddressAndBlockchain,
  getContactById,
  getContactsByAccountId,
  updateContact as updateContactRepository,
} from "@src/app/(app)/(auth)/contacts/_utils/contacts-repository"
import type { Contact as ContactSchema } from "@src/app/(app)/(auth)/contacts/_utils/schema"
import { validationRecipientAddress } from "@src/components/DefuseSDK/features/withdraw/components/WithdrawForm/components/RecipientSubForm/validationRecipientAddress"
import type { SupportedChainName } from "@src/components/DefuseSDK/types/base"
import {
  assetNetworkAdapter,
  reverseAssetNetworkAdapter,
} from "@src/components/DefuseSDK/utils/adapters"
import { isSupportedChainName } from "@src/components/DefuseSDK/utils/blockchain"
import { renderRecipientAddressError } from "@src/components/DefuseSDK/utils/validationErrors"
import { getAccountIdFromToken } from "@src/utils/dummyAuth"
import { logger } from "@src/utils/logger"
import { cookies } from "next/headers"
import * as v from "valibot"

type ActionResult<T> = { ok: true; value: T } | { ok: false; error: string }

const AUTH_TOKEN_KEY = "defuse_auth_token"

const CreateContactFormSchema = v.object({
  address: v.pipe(v.string(), v.nonEmpty("Address is required")),
  name: v.pipe(v.string(), v.nonEmpty("Name is required")),
})

const UpdateContactFormSchema = v.object({
  contactId: v.pipe(v.string(), v.uuid("Contact ID must be a valid UUID")),
  address: v.pipe(v.string(), v.nonEmpty("Address is required")),
  name: v.pipe(v.string(), v.nonEmpty("Name is required")),
})

const DeleteContactFormSchema = v.object({
  contactId: v.pipe(v.string(), v.uuid("Contact ID must be a valid UUID")),
})

/** Contact blockchain can be a BlockchainEnum or "near_intents" for internal transfers */
export type ContactBlockchain = BlockchainEnum | "near_intents"

export type Contact = Omit<
  ContactSchema,
  "createdAt" | "updatedAt" | "blockchain"
> & {
  id: string
  blockchain: ContactBlockchain
}

type ContactEntity = {
  id: string
  contactId: string
  accountId: string
  address: string
  name: string
  blockchain: string
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

    const accountId = getAccountIdFromToken(token)
    if (!accountId) {
      return { ok: false, error: "Invalid token" }
    }

    const contactsData = await getContactsByAccountId(accountId, input?.search)

    const contacts: Array<Contact> = []
    for (const contact of contactsData) {
      // Handle near_intents as a special case
      if (contact.blockchain === "near_intents") {
        contacts.push({
          contactId: contact.contactId,
          accountId: contact.accountId,
          address: contact.address,
          name: contact.name,
          blockchain: "near_intents",
          id: contact.contactId,
        })
        continue
      }

      if (!isSupportedChainName(contact.blockchain)) {
        continue
      }

      const blockchain: SupportedChainName = contact.blockchain
      const blockchainEnum = assetNetworkAdapter[blockchain]
      contacts.push({
        contactId: contact.contactId,
        accountId: contact.accountId,
        address: contact.address,
        name: contact.name,
        blockchain: blockchainEnum,
        id: contact.contactId,
      })
    }

    return { ok: true, value: contacts }
  } catch (error) {
    logger.error("Failed to fetch contacts", { cause: error })
    return { ok: false, error: "Failed to fetch contacts" }
  }
}

export async function createContact(input: {
  name: string
  address: string
  blockchain: ContactBlockchain
  userAddress?: string
  chainType?: AuthMethod
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

  const accountId = getAccountIdFromToken(token)
  if (!accountId) {
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

  // Handle near_intents as a special case - it's not in reverseAssetNetworkAdapter
  const blockchain =
    input.blockchain === "near_intents"
      ? "near_intents"
      : reverseAssetNetworkAdapter[input.blockchain]

  const validationResult = await validationRecipientAddress(
    data.output.address,
    blockchain,
    input.userAddress ?? "",
    input.chainType
  )

  if (validationResult.isErr()) {
    logger.warn("Contact address validation failed", {
      source: "create-contact",
      action: "address-validation-error",
      address: data.output.address,
      blockchain,
      error: validationResult.unwrapErr(),
    })
    return {
      ok: false,
      error: renderRecipientAddressError(validationResult.unwrapErr()),
    }
  }

  const existingContact = await getContactByAccountAddressAndBlockchain(
    accountId,
    data.output.address,
    blockchain
  )

  if (existingContact) {
    logger.warn("Contact already exists", {
      source: "create-contact",
      action: "duplicate-contact",
      accountId,
      address: data.output.address,
      blockchain,
    })
    return {
      ok: false,
      error:
        "A contact with this network and address combination already exists.",
    }
  }

  const entity = await createContactRepository({
    accountId,
    address: data.output.address,
    name: data.output.name,
    blockchain,
  })

  if (!entity) {
    logger.error("Failed to create contact in repository", {
      source: "create-contact",
      action: "repository-error",
      accountId,
    })
    return { ok: false, error: "Failed to create contact" }
  }

  return {
    ok: true,
    value: {
      id: entity.contactId,
      contactId: entity.contactId,
      accountId: entity.accountId,
      address: entity.address,
      name: entity.name,
      blockchain: entity.blockchain,
    },
  }
}

export async function updateContact(input: {
  contactId: string
  name: string
  address: string
  blockchain: ContactBlockchain
  userAddress?: string
  chainType?: AuthMethod
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

  const accountId = getAccountIdFromToken(token)
  if (!accountId) {
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

  // Handle near_intents as a special case - it's not in reverseAssetNetworkAdapter
  const blockchain =
    input.blockchain === "near_intents"
      ? "near_intents"
      : reverseAssetNetworkAdapter[input.blockchain]

  const validationResult = await validationRecipientAddress(
    data.output.address,
    blockchain,
    input.userAddress ?? "",
    input.chainType
  )

  if (validationResult.isErr()) {
    logger.warn("Contact address validation failed", {
      source: "update-contact",
      action: "address-validation-error",
      address: data.output.address,
      blockchain,
      error: validationResult.unwrapErr(),
    })
    return {
      ok: false,
      error: renderRecipientAddressError(validationResult.unwrapErr()),
    }
  }

  // Check if contact exists and belongs to the account
  const existingContact = await getContactById(data.output.contactId)

  if (!existingContact) {
    logger.warn("Contact not found when updating", {
      source: "update-contact",
      action: "contact-not-found",
      contactId: data.output.contactId,
      accountId,
    })
    return { ok: false, error: "Contact not found" }
  }

  if (existingContact.accountId !== accountId) {
    logger.error("Unauthorized attempt to update contact", {
      source: "update-contact",
      action: "permission-denied",
      contactId: data.output.contactId,
      accountId,
      contactAccountId: existingContact.accountId,
    })
    return { ok: false, error: "Permission denied" }
  }

  const updatedContact = await updateContactRepository(data.output.contactId, {
    address: data.output.address,
    name: data.output.name,
    blockchain,
  })

  if (!updatedContact) {
    logger.error("Failed to update contact in repository", {
      source: "update-contact",
      action: "repository-error",
      contactId: data.output.contactId,
      accountId,
    })
    return { ok: false, error: "Failed to update contact" }
  }

  return {
    ok: true,
    value: {
      id: updatedContact.contactId,
      contactId: updatedContact.contactId,
      accountId: updatedContact.accountId,
      address: updatedContact.address,
      name: updatedContact.name,
      blockchain: updatedContact.blockchain,
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

  const accountId = getAccountIdFromToken(token)
  if (!accountId) {
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
      accountId,
    })
    return { ok: false, error: "Contact not found" }
  }

  if (existingContact.accountId !== accountId) {
    logger.error("Unauthorized attempt to delete contact", {
      source: "delete-contact",
      action: "permission-denied",
      contactId: data.output.contactId,
      accountId,
      contactAccountId: existingContact.accountId,
    })
    return { ok: false, error: "Permission denied" }
  }

  await deleteContactRepository(data.output.contactId)

  return { ok: true, value: null }
}
