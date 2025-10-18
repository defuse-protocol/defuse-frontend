import { resolve } from "node:path"
import { config } from "dotenv"

config({ path: resolve(process.cwd(), ".env.local") })

export const getSeedPhrase = () => {
  const phrase = process.env.MM_SEED_PHRASE

  if (!phrase) {
    throw new Error("The MM_SEED_PHRASE environment variable is required")
  }

  return phrase
}
