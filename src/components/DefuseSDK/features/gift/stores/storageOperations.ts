import { authIdentity } from "@defuse-protocol/internal-utils"
import { logger } from "@src/utils/logger"
import type { IntentsUserId, SignerCredentials } from "../../../core/formatters"
import { deserialize } from "../../../utils/deserialize"
import { serialize } from "../../../utils/serialize"
import type { GiftStorageState, State } from "./giftMakerHistory"
import { indexedDBStorage } from "./indexedDBStorage"

export type StorageOperationErr =
  | "ERR_SET_ITEM_FAILED_TO_STORAGE"
  | "ERR_UPDATE_ITEM_FAILED_TO_STORAGE"
  | "ERR_REMOVE_ITEM_FAILED_FROM_STORAGE"
  | "ERR_STORAGE_OPERATION_EXCEPTION"

export type StorageOperationResult =
  | { tag: "ok" }
  | {
      tag: "err"
      reason: StorageOperationErr
    }

export const storage = {
  getItem: async (
    name: string
  ): Promise<{ state: State; version: number } | null> => {
    try {
      const rawData = await indexedDBStorage.getItem(name)

      // Due to we migrate to single storage, we need to be backward compatible with users who have data in localStorage or sessionStorage
      // TODO: Remove this once all users have migrated to the new storage
      const localStorageData = localStorage.getItem(name)
      const sessionStorageData = sessionStorage.getItem(name)

      const storageData = rawData ?? localStorageData ?? sessionStorageData
      if (!storageData) return null

      return deserialize(storageData) as { state: State; version: number }
    } catch (error) {
      logger.error(new Error("Failed to get data", { cause: error }))
      throw new Error("Failed to get data")
    }
  },

  setItem: async (
    name: string,
    value: GiftStorageState
  ): Promise<StorageOperationResult> => {
    try {
      const stringValue = serialize(value)
      await indexedDBStorage.setItem(name, stringValue)

      return { tag: "ok" }
    } catch (error) {
      logger.error(new Error("Failed to set item", { cause: error }))
      return { tag: "err", reason: "ERR_SET_ITEM_FAILED_TO_STORAGE" }
    }
  },

  updateItem: async (
    name: string,
    value: GiftStorageState
  ): Promise<StorageOperationResult> => {
    try {
      const stringValue = serialize(value)
      await indexedDBStorage.setItem(name, stringValue)

      return { tag: "ok" }
    } catch (error) {
      logger.error(new Error("Failed to update item", { cause: error }))
      return { tag: "err", reason: "ERR_UPDATE_ITEM_FAILED_TO_STORAGE" }
    }
  },

  removeItem: async (name: string): Promise<StorageOperationResult> => {
    try {
      await indexedDBStorage.removeItem(name)

      return { tag: "ok" }
    } catch (error) {
      logger.error(new Error("Failed to remove item", { cause: error }))
      return { tag: "err", reason: "ERR_REMOVE_ITEM_FAILED_FROM_STORAGE" }
    }
  },
}

export function getUserId(
  user: IntentsUserId | SignerCredentials
): IntentsUserId {
  return typeof user === "string"
    ? user
    : authIdentity.authHandleToIntentsUserId(
        user.credential,
        user.credentialType
      )
}
