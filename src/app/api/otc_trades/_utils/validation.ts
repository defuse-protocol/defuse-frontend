import { z } from "zod"

export const rawIdSchema = z.string().refine(
  (val) => {
    // Format: 25 characters of lowercase letters, numbers, and hyphens
    return /^[a-z0-9-]{25}$/.test(val)
  },
  {
    message:
      "raw_id must be 25 characters long and contain only lowercase letters, numbers, and hyphens",
  }
)
