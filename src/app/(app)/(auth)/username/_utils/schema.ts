import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const authMethodEnum = [
  "near",
  "evm",
  "solana",
  "webauthn",
  "ton",
  "stellar",
  "tron",
] as const

export const authMethodPgEnum = pgEnum("auth_method", authMethodEnum)

export const tagsTable = pgTable("tags", {
  authTag: text("auth_tag").primaryKey(),
  authIdentifier: text("auth_identifier").notNull(),
  authMethod: authMethodPgEnum("auth_method").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type Tag = typeof tagsTable.$inferSelect
export type NewTag = typeof tagsTable.$inferInsert
