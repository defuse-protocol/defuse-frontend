import { z } from "zod"

export const tradeIdSchema = z
  .string()
  .uuid()
  .refine(
    (val) => {
      const version = val[14]
      // Need to support both UUID v4 and v5 for backwards compatibility
      return version === "4" || version === "5"
    },
    {
      message: "Invalid trade_id format",
    }
  )
