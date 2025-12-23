import { drizzle } from "drizzle-orm/mysql2"
import mysql from "mysql2/promise"

import * as schema from "@src/db/intents/schema"
import { INTENTS_DB_URL } from "@src/utils/environment"

function createIntentsDb() {
  if (!INTENTS_DB_URL) {
    return null
  }

  const pool = mysql.createPool({
    uri: INTENTS_DB_URL,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  })

  return drizzle(pool, { schema, mode: "default" })
}

export const intentsDb = createIntentsDb()

export type IntentsDb = NonNullable<typeof intentsDb>
