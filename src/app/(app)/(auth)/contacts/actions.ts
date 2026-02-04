"use server"

import {
  type AuthMethod,
  type BlockchainEnum,
  authIdentity,
} from "@defuse-protocol/internal-utils"
import { getActiveWalletAddress, getWalletToken } from "@src/actions/auth"
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
import { verifyAppAuthToken } from "@src/utils/authJwt"
import { logger } from "@src/utils/logger"
import { validate as isValidUuid } from "uuid"
import * as v from "valibot"

type ActionResult<T> = { ok: true; value: T } | { ok: false; error: string }

type AuthResult = { ok: true; accountId: string } | { ok: false; error: string }

/**
 * Authenticates the current request using the active wallet cookie.
 * Verifies the JWT token and ensures the identity matches.
 */
async function authenticate(): Promise<AuthResult> {
  const walletAddress = await getActiveWalletAddress()
  if (!walletAddress) {
    logger.warn("No active wallet")
    return { ok: false, error: "Authentication required" }
  }

  const token = await getWalletToken(walletAddress)
  if (!token) {
    logger.warn("Auth token missing")
    return { ok: false, error: "Authentication required" }
  }

  const payload = await verifyAppAuthToken(token)
  if (!payload) {
    logger.warn("Invalid token")
    return { ok: false, error: "Invalid or expired token" }
  }

  if (payload.auth_identifier !== walletAddress) {
    logger.warn("Token identity mismatch")
    return { ok: false, error: "Authentication error" }
  }

  const accountId = authIdentity.authHandleToIntentsUserId(
    payload.auth_identifier,
    payload.auth_method
  )

  return { ok: true, accountId }
}

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

export type Contact = Omit<
  ContactSchema,
  "createdAt" | "updatedAt" | "blockchain"
> & {
  id: string
  blockchain: BlockchainEnum
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
  search?: string
}): Promise<ActionResult<Array<Contact>>> {
  try {
    const auth = await authenticate()
    if (!auth.ok) {
      return { ok: false, error: auth.error }
    }

    const contactsData = await getContactsByAccountId(
      auth.accountId,
      input?.search
    )

    const contacts: Array<Contact> = contactsData
      .map((contact) => {
        if (!isSupportedChainName(contact.blockchain)) {
          return null
        }

        const blockchain: SupportedChainName = contact.blockchain
        const blockchainEnum = assetNetworkAdapter[blockchain]
        return {
          contactId: contact.contactId,
          accountId: contact.accountId,
          address: contact.address,
          name: contact.name,
          blockchain: blockchainEnum,
          id: contact.contactId,
        }
      })
      .filter((contact): contact is Contact => contact !== null)

    return { ok: true, value: contacts }
  } catch (error) {
    logger.error("Failed to fetch contacts", { cause: error })
    return {
      ok: false,
      error:
        "We were unable to retrieve your contacts. This could be a network issue. Please try again.",
    }
  }
}

export async function createContact(input: {
  name: string
  address: string
  blockchain: BlockchainEnum
  userAddress?: string
  chainType?: AuthMethod
}): Promise<ActionResult<ContactEntity>> {
  const auth = await authenticate()
  if (!auth.ok) {
    return { ok: false, error: auth.error }
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

  const blockchain = reverseAssetNetworkAdapter[input.blockchain]

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
    auth.accountId,
    data.output.address,
    blockchain
  )

  if (existingContact) {
    logger.warn("Contact already exists", {
      source: "create-contact",
      action: "duplicate-contact",
      accountId: auth.accountId,
      address: data.output.address,
      blockchain,
    })
    return { ok: false, error: "Contact already exists" }
  }

  const entity = await createContactRepository({
    accountId: auth.accountId,
    address: data.output.address,
    name: data.output.name,
    blockchain,
  })

  if (!entity) {
    logger.error("Failed to create contact in repository", {
      source: "create-contact",
      action: "repository-error",
      accountId: auth.accountId,
    })
    return {
      ok: false,
      error:
        "We were unable to create your contact. This could be a network issue. Please try again.",
    }
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
  blockchain: BlockchainEnum
  userAddress?: string
  chainType?: AuthMethod
}): Promise<ActionResult<ContactEntity>> {
  const auth = await authenticate()
  if (!auth.ok) {
    return { ok: false, error: auth.error }
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

  const blockchain = reverseAssetNetworkAdapter[input.blockchain]

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
      accountId: auth.accountId,
    })
    return { ok: false, error: "Contact not found" }
  }

  if (existingContact.accountId !== auth.accountId) {
    logger.error("Unauthorized attempt to update contact", {
      source: "update-contact",
      action: "permission-denied",
      contactId: data.output.contactId,
      accountId: auth.accountId,
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
      accountId: auth.accountId,
    })
    return {
      ok: false,
      error:
        "We were unable to update your contact. This could be a network issue. Please try again.",
    }
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

export async function getContactByAddressAction(input: {
  address: string
  blockchain: SupportedChainName
}): Promise<ActionResult<Contact | null>> {
  try {
    const auth = await authenticate()
    if (!auth.ok) {
      return { ok: false, error: auth.error }
    }

    const contact = await getContactByAccountAddressAndBlockchain(
      auth.accountId,
      input.address,
      input.blockchain
    )

    if (!contact) {
      return { ok: true, value: null }
    }

    if (!isSupportedChainName(contact.blockchain)) {
      return { ok: true, value: null }
    }

    const blockchain: SupportedChainName = contact.blockchain
    const blockchainEnum = assetNetworkAdapter[blockchain]

    return {
      ok: true,
      value: {
        contactId: contact.contactId,
        accountId: contact.accountId,
        address: contact.address,
        name: contact.name,
        blockchain: blockchainEnum,
        id: contact.contactId,
      },
    }
  } catch (error) {
    logger.error("Failed to fetch contact by address", { cause: error })
    return {
      ok: false,
      error: "We were unable to retrieve the contact. Please try again.",
    }
  }
}

export async function getContactByIdAction(input: {
  contactId: string
}): Promise<ActionResult<Contact | null>> {
  try {
    // Validate UUID format first to avoid database errors
    if (!isValidUuid(input.contactId)) {
      logger.warn("Invalid contactId format", {
        source: "get-contact-by-id",
        action: "invalid-format",
        contactId: input.contactId,
      })
      return { ok: false, error: "Invalid contact ID format" }
    }

    const auth = await authenticate()
    if (!auth.ok) {
      return { ok: false, error: auth.error }
    }

    const contact = await getContactById(input.contactId)

    if (!contact) {
      return { ok: true, value: null }
    }

    // Verify the contact belongs to the authenticated user
    if (contact.accountId !== auth.accountId) {
      logger.warn("Unauthorized attempt to access contact", {
        source: "get-contact-by-id",
        action: "permission-denied",
        contactId: input.contactId,
        accountId: auth.accountId,
      })
      return { ok: false, error: "Permission denied" }
    }

    if (!isSupportedChainName(contact.blockchain)) {
      return { ok: true, value: null }
    }

    const blockchain: SupportedChainName = contact.blockchain
    const blockchainEnum = assetNetworkAdapter[blockchain]

    return {
      ok: true,
      value: {
        contactId: contact.contactId,
        accountId: contact.accountId,
        address: contact.address,
        name: contact.name,
        blockchain: blockchainEnum,
        id: contact.contactId,
      },
    }
  } catch (error) {
    logger.error("Failed to fetch contact by ID", {
      cause: error,
      contactId: input.contactId,
    })
    return {
      ok: false,
      error: "We were unable to retrieve the contact. Please try again.",
    }
  }
}

export async function deleteContact(input: {
  contactId: string
}): Promise<ActionResult<null>> {
  const auth = await authenticate()
  if (!auth.ok) {
    return { ok: false, error: auth.error }
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
      accountId: auth.accountId,
    })
    return { ok: false, error: "Contact not found" }
  }

  if (existingContact.accountId !== auth.accountId) {
    logger.error("Unauthorized attempt to delete contact", {
      source: "delete-contact",
      action: "permission-denied",
      contactId: data.output.contactId,
      accountId: auth.accountId,
      contactAccountId: existingContact.accountId,
    })
    return { ok: false, error: "Permission denied" }
  }

  await deleteContactRepository(data.output.contactId)

  return { ok: true, value: null }
}
