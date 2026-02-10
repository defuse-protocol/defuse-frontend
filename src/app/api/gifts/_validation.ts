import { z } from "zod"

export const giftIdSchema = z
  .string()
  .uuid()
  .refine((val) => val[14] === "5", "Invalid gift_id format")
