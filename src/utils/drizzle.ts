import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { DATABASE_URL } from "@src/utils/environment"

if (!DATABASE_URL) {
  throw new Error("Missing POSTGRES_PRISMA_URL environment variable")
}

const client = postgres(DATABASE_URL, { prepare: false })

export const db = drizzle({ client })
