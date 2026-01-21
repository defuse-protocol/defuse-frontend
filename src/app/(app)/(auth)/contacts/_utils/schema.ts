import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const contactsTable = pgTable("contacts", {
  contactId: uuid("contact_id").primaryKey().defaultRandom(),
  account_id: text("account_id").notNull(),
  address: text("address").notNull(),
  name: text("name").notNull(),
  blockchain: text("blockchain").notNull(),
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
