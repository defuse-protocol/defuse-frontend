import { z } from "zod"

export const NEAR_INTENTS_PAGE = {
  baseURL: z
    .string()
    .min(1, "NEXT_PUBLIC_BASE_URL must be a non-empty string")
    .parse(process.env.NEXT_PUBLIC_BASE_URL),
}
