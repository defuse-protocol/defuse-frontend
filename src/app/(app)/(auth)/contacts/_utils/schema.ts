import { AuthMethod } from "@defuse-protocol/internal-utils"
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

const authMethodEnum = [
  AuthMethod.Near,
  AuthMethod.EVM,
  AuthMethod.Solana,
  AuthMethod.WebAuthn,
  AuthMethod.Ton,
  AuthMethod.Stellar,
  AuthMethod.Tron,
] as const

export const authMethodPgEnum = pgEnum("auth_method", authMethodEnum)

export const contactsTable = pgTable("contacts", {
  contactId: uuid("contact_id").primaryKey().defaultRandom(),
  account_id: text("account_id").notNull(),
  address: text("address").notNull(),
  name: text("name").notNull(),
  network: text("network").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type Contact = typeof contactsTable.$inferSelect
export type NewContact = typeof contactsTable.$inferInsert
