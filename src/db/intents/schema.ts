import { sql } from "drizzle-orm"
import {
  bigint,
  datetime,
  index,
  int,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core"

export const anyInputQuoteWithdrawal = mysqlTable(
  "AnyInputQuoteWithdrawal",
  {
    id: int().autoincrement().notNull(),
    amountOut: varchar({ length: 64 }).notNull(),
    amountOutFormatted: varchar({ length: 32 }).notNull(),
    amountOutUsd: varchar({ length: 32 }).notNull(),
    withdrawFee: varchar({ length: 64 }).notNull(),
    withdrawFeeFormatted: varchar({ length: 32 }).notNull(),
    withdrawFeeUsd: varchar({ length: 32 }).notNull(),
    timestamp: timestamp({ fsp: 3, mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    status: varchar({ length: 32 }).notNull(),
    destinationChainTxHash: varchar({ length: 256 }).notNull(),
    intentHash: varchar({ length: 256 }).notNull(),
    createdAt: datetime({ mode: "string", fsp: 6 })
      .default(sql`(CURRENT_TIMESTAMP(6))`)
      .notNull(),
    updatedAt: datetime({ mode: "string", fsp: 6 })
      .default(sql`(CURRENT_TIMESTAMP(6))`)
      .notNull(),
    quoteId: int().references(() => quotes.id),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "AnyInputQuoteWithdrawal_id" }),
  ]
)

export const fees = mysqlTable(
  "Fees",
  {
    id: int().autoincrement().notNull(),
    recipient: varchar({ length: 255 }).notNull(),
    fee: int().notNull(),
    quoteId: int().references(() => quotes.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("IDX__fees__quoteId").on(table.quoteId),
    index("IDX__fees__recipient_quoteId").on(table.recipient, table.quoteId),
    index("IDX__fees__quoteId_recipient").on(table.quoteId, table.recipient),
    primaryKey({ columns: [table.id], name: "Fees_id" }),
  ]
)

export const quoteEvents = mysqlTable(
  "QuoteEvents",
  {
    id: int().autoincrement().notNull(),
    depositAddress: varchar({ length: 128 }).notNull(),
    accountId: varchar({ length: 64 }).notNull(),
    status: varchar({ length: 32 }).notNull(),
    event: varchar({ length: 64 }).notNull(),
    timestamp: timestamp({ fsp: 3, mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    depositMemo: varchar({ length: 64 }),
  },
  (table) => [
    index("IDX_quote_events_timestamp").on(table.timestamp),
    index("idx_qe_addr_ts").on(table.depositAddress, table.timestamp),
    primaryKey({ columns: [table.id], name: "QuoteEvents_id" }),
  ]
)

export const quotes = mysqlTable(
  "Quotes",
  {
    id: int().autoincrement().notNull(),
    swapType: varchar({ length: 32 }).notNull(),
    slippageTolerance: int().notNull(),
    originAsset: varchar({ length: 255 }).notNull(),
    depositType: varchar({ length: 32 }).notNull(),
    destinationAsset: varchar({ length: 255 }).notNull(),
    amount: varchar({ length: 64 }).notNull(),
    refundTo: varchar({ length: 256 }).notNull(),
    refundType: varchar({ length: 32 }).notNull(),
    recipient: varchar({ length: 256 }).notNull(),
    recipientType: varchar({ length: 32 }).notNull(),
    requestDeadline: timestamp({ fsp: 3, mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    referral: varchar({ length: 64 }),
    depositAddress: varchar({ length: 128 }).notNull(),
    accountId: varchar({ length: 64 }).notNull(),
    errorMessage: varchar({ length: 64 }),
    amountIn: varchar({ length: 64 }).notNull(),
    amountInFormatted: varchar({ length: 32 }).notNull(),
    amountInUsd: varchar({ length: 32 }).notNull(),
    minAmountIn: varchar({ length: 64 }).notNull(),
    amountOut: varchar({ length: 64 }).notNull(),
    amountOutFormatted: varchar({ length: 32 }).notNull(),
    amountOutUsd: varchar({ length: 32 }).notNull(),
    minAmountOut: varchar({ length: 64 }).notNull(),
    deadline: timestamp({ fsp: 3, mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    timeWhenInactive: timestamp({ fsp: 3, mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    timestamp: timestamp({ fsp: 3, mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    signature: varchar({ length: 256 }).notNull(),
    status: varchar({ length: 32 }).notNull(),
    intentHashes: text(),
    nearTxHashes: text(),
    originChainTxHashes: text(),
    destinationChainTxHashes: text(),
    actualAmountIn: varchar({ length: 64 }),
    actualAmountInFormatted: varchar({ length: 32 }),
    actualAmountInUsd: varchar({ length: 32 }),
    actualAmountOut: varchar({ length: 64 }),
    actualAmountOutFormatted: varchar({ length: 32 }),
    actualAmountOutUsd: varchar({ length: 32 }),
    actualSlippage: int(),
    refundedAmount: varchar({ length: 64 }).notNull(),
    refundedAmountFormatted: varchar({ length: 32 }).notNull(),
    refundedAmountUsd: varchar({ length: 32 }).notNull(),
    createdAt: datetime({ mode: "string", fsp: 6 })
      .default(sql`(CURRENT_TIMESTAMP(6))`)
      .notNull(),
    updatedAt: datetime({ mode: "string", fsp: 6 })
      .default(sql`(CURRENT_TIMESTAMP(6))`)
      .notNull(),
    timeEstimate: int().notNull(),
    quoteWaitingTimeMs: int().notNull(),
    virtualChainRecipient: varchar({ length: 64 }),
    virtualChainRefundRecipient: varchar({ length: 64 }),
    virtualChainProxyTokenRecipient: varchar({ length: 64 }),
    virtualChainProxyTokenRefundRecipient: varchar({ length: 64 }),
    customRecipientMsg: varchar({ length: 1024 }),
    partnerId: varchar({ length: 64 }),
    depositMode: varchar({ length: 32 }).default("SIMPLE").notNull(),
    depositMemo: varchar({ length: 64 }),
    derivationVersion: varchar({ length: 32 }).default("v1").notNull(),
    depositedAmount: varchar({ length: 128 }),
    depositedAmountFormatted: varchar({ length: 128 }),
    depositedAmountUsd: varchar({ length: 128 }),
    refundReason: text(),
  },
  (table) => [
    index("IDX__quote__deposit_address").on(table.depositAddress),
    index("IDX__quote__status").on(table.status),
    index("IDX__quote__accountId").on(table.accountId),
    index("IDX__quote__createdAt").on(table.createdAt),
    index("IDX__quote__createdAt_depositAddress").on(
      table.createdAt,
      table.depositAddress
    ),
    index("IDX__quote__recipient_depositAddress").on(
      table.recipient,
      table.depositAddress
    ),
    index("IDX__quote__originAsset").on(table.originAsset),
    index("IDX__quote__destinationAsset").on(table.destinationAsset),
    index("IDX__quote__referral").on(table.referral),
    index("IDX__quote__status_createdAt_depositAddress").on(
      table.status,
      table.createdAt,
      table.depositAddress
    ),
    index("IDX__quote__status_createdAt_referral").on(
      table.status,
      table.createdAt,
      table.referral
    ),
    index("IDX__quote__createdAt_referral").on(table.createdAt, table.referral),
    index("IDX__quote__status_referral_recipient_createdAt").on(
      table.status,
      table.referral,
      table.recipient,
      table.createdAt
    ),
    index("IDX__quote__depositAddress").on(table.depositAddress),
    index("IDX__quote__recipient").on(table.recipient),
    index("IDX__quote__intentHashes").on(table.intentHashes),
    primaryKey({ columns: [table.id], name: "Quotes_id" }),
    unique("IDX_fe6def0328556c06492872d508").on(table.accountId),
    unique("UQ__quote__depositAddress_depositMemo").on(
      table.depositAddress,
      table.depositMemo
    ),
  ]
)

export const migrations = mysqlTable(
  "migrations",
  {
    id: int().autoincrement().notNull(),
    timestamp: bigint({ mode: "number" }).notNull(),
    name: varchar({ length: 255 }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.id], name: "migrations_id" })]
)
