import { defineConfig } from "drizzle-kit"

if (!process.env.INTENTS_DB_URL) {
  throw new Error("INTENTS_DB_URL environment variable is required")
}

export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/intents/schema.ts",
  out: "./src/db/intents",
  dbCredentials: {
    url: process.env.INTENTS_DB_URL,
  },
})
