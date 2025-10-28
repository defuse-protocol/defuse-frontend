import { resolve } from "node:path"
import { config } from "dotenv"
import { z } from "zod"

config({ path: resolve(process.cwd(), ".env.local") })

export const NEAR_INTENTS_PAGE = {
  baseURL: z
    .string()
    .min(1, "NEXT_PUBLIC_BASE_URL must be a non-empty string")
    .parse(process.env.NEXT_PUBLIC_BASE_URL),
}
