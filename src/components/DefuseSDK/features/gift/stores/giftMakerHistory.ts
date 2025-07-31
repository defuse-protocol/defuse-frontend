import type { BaseTokenInfo } from "@src/components/DefuseSDK/types/base"
import type { KeyPairString } from "near-api-js/lib/utils"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { SignerCredentials } from "../../../core/formatters"
import { logger } from "../../../logger"
import type { IntentsUserId } from "../../../types/intentsUserId"
import { config as configDBStorage } from "./indexedDBStorage"
import { migrateGiftStorage } from "./migrations"
import {
  type StorageOperationResult,
  getUserId,
  storage,
} from "./storageOperations"

export interface GiftMakerHistory {
  tokenDiff: Record<BaseTokenInfo["defuseAssetId"], bigint>
  secretKey: KeyPairString
  message: string
  iv: string
  intentHashes: string[]
  createdAt: number
  updatedAt: number
}

export type State = {
  gifts: Record<IntentsUserId, GiftMakerHistory[]>
}

export type GiftStorageState = {
  state: {
    gifts: Record<IntentsUserId, GiftMakerHistory[]>
  }
}

export type Actions = {
  addGift: (
    gift: Omit<GiftMakerHistory, "updatedAt">,
    userId: IntentsUserId | SignerCredentials
  ) => Promise<StorageOperationResult>
  updateGift: (
    secretKey: string,
    userId: IntentsUserId | SignerCredentials,
    intentHashes: string[]
  ) => Promise<StorageOperationResult>
  removeGift: (
    secretKey: string,
    userId: IntentsUserId | SignerCredentials
  ) => Promise<StorageOperationResult>
}

export type Store = State & Actions

export const giftMakerHistoryStore = create<Store>()(
  persist(
    (set, get) => ({
      gifts: {},

      addGift: async (gift, user) => {
        const userId = getUserId(user)
        const newState = {
          gifts: {
            ...get().gifts,
            [userId]: [
              ...(get().gifts[userId] ?? []),
              {
                ...gift,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
            ],
          },
        }

        try {
          const result = await storage.setItem(configDBStorage.dbName, {
            state: newState,
          })
          if (result.tag === "err") {
            return result
          }
          set(newState)
          return result
        } catch (error) {
          logger.error(new Error("Failed to add gift", { cause: error }))
          return { tag: "err", reason: "ERR_UPDATE_ITEM_FAILED_TO_STORAGE" }
        }
      },

      updateGift: async (secretKey, user, intentHashes) => {
        const userId = getUserId(user)
        const newState = {
          gifts: {
            ...get().gifts,
            [userId]: (get().gifts[userId] ?? []).map((g) =>
              g.secretKey === secretKey
                ? { ...g, intentHashes, updatedAt: Date.now() }
                : g
            ),
          },
        }

        try {
          const result = await storage.updateItem(configDBStorage.dbName, {
            state: newState,
          })
          if (result.tag === "err") {
            return result
          }
          set(newState)
          return result
        } catch (error) {
          logger.error(new Error("Failed to update gift", { cause: error }))
          return { tag: "err", reason: "ERR_UPDATE_ITEM_FAILED_TO_STORAGE" }
        }
      },

      removeGift: async (secretKey, user) => {
        const userId = getUserId(user)
        const newState = {
          gifts: {
            ...get().gifts,
            [userId]: (get().gifts[userId] ?? []).filter(
              (gift) => gift.secretKey !== secretKey
            ),
          },
        }

        try {
          const result = await storage.removeItem(configDBStorage.dbName)
          if (result.tag === "err") {
            return result
          }
          set(newState)
          return result
        } catch (error) {
          logger.error(new Error("Failed to remove gift", { cause: error }))
          return { tag: "err", reason: "ERR_REMOVE_ITEM_FAILED_FROM_STORAGE" }
        }
      },
    }),
    {
      name: configDBStorage.dbName,
      storage,
      version: 2,
      migrate: migrateGiftStorage,
    }
  )
)

export { giftMakerHistoryStore as useGiftMakerHistory }
