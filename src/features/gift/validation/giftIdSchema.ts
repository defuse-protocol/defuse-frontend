import { z } from "zod"

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
