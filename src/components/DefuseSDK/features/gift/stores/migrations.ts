import * as v from "valibot"
import { logger } from "../../../logger"
import {
  GiftStorageSchemaV0,
  GiftStorageSchemaV1,
} from "../utils/schemaStorage"
import type { State } from "./giftMakerHistory"

export const migrateV0ToV1 = (
  validatedV0: v.InferOutput<typeof GiftStorageSchemaV0>
) => {
  return {
    state: {
      gifts: Object.fromEntries(
        Object.entries(validatedV0.state.gifts).map(([userId, gifts]) => [
          userId,
          gifts.map((gift) => ({
            ...gift,
            tokenDiff: Object.fromEntries(
              Object.entries(gift.tokenDiff).map(([key, value]) => [
                key,
                BigInt(value),
              ])
            ),
          })),
        ])
      ),
    },
  }
}

export const migrateV1ToV2 = (
  validatedV1: v.InferOutput<typeof GiftStorageSchemaV1>
) => {
  return {
    state: {
      gifts: Object.fromEntries(
        Object.entries(validatedV1.state.gifts).map(([userId, gifts]) => [
          userId,
          gifts.map((gift) => ({
            tokenDiff: gift.tokenDiff,
            secretKey: gift.secretKey,
            message: gift.message,
            intentHashes: gift.intentHashes,
            createdAt: gift.updatedAt,
            updatedAt: gift.updatedAt,
          })),
        ])
      ),
    },
  }
}

export const migrateGiftStorage = (
  persistedState: unknown,
  version: number
): State => {
  try {
    let currentState = { state: persistedState }
    let currentVersion = version

    // Migrate from v0 to v1 if needed
    if (currentVersion === 0) {
      const validatedV0 = v.parse(GiftStorageSchemaV0, currentState)
      const migratedStateToV1 = migrateV0ToV1(validatedV0)
      currentState = migratedStateToV1
      currentVersion = 1
    }

    // Migrate from v1 to v2 if needed
    if (currentVersion === 1) {
      const validatedV1 = v.parse(GiftStorageSchemaV1, currentState)
      const migratedStateToV2 = migrateV1ToV2(validatedV1)
      currentState = migratedStateToV2
      currentVersion = 2
    }

    return currentState.state as State
  } catch (error) {
    logger.error(new Error("Failed to migrate gift storage", { cause: error }))
    throw new Error("Failed to migrate gift storage. Please contact support.")
  }
}
