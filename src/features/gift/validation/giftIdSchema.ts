import { z } from "zod"

const ONE_MINUTE_MS = 60 * 1000

/**
 * Validates a gift ID is a valid UUID v5 format.
 * UUID v5 has version bits set to 5 (0101) at position 14.
 */
export const giftIdSchema = z
  .string()
  .uuid()
  .refine((val) => {
    return val[14] === "5"
  }, "Invalid gift_id format")

/**
 * Validates expiration timestamp is at least 1 minute in the future.
 * The buffer accounts for request processing time.
 */
export const expiresAtSchema = z
  .number()
  .int()
  .refine(
    (val) => val > Date.now() + ONE_MINUTE_MS,
    "Expiration must be at least 1 minute in the future"
  )
