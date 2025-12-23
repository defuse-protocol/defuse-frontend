import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "mysql",
  out: "./src/db/intents",
  dbCredentials: {
    url: process.env.INTENTS_DB_URL!,
  },
})
