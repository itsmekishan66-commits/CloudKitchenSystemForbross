import {
  int,
  mysqlTable,
  varchar,
  decimal,
  timestamp,
  mysqlEnum,
  text,
  date,
  boolean,
} from "drizzle-orm/mysql-core";
import { users } from "./users";

export const chartOfAccounts = mysqlTable("chart_of_accounts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", [
    "asset",
    "liability",
    "equity",
    "revenue",
    "expense",
  ]).notNull(),
  subType: mysqlEnum("sub_type", [
    "current_asset",
    "fixed_asset",
    "current_liability",
    "long_term_liability",
    "equity",
    "revenue",
    "cogs",
    "operating_expense",
    "non_operating_expense",
  ]).notNull(),
  description: text("description"),
  parentId: varchar("parent_id", { length: 36 }),
  isActive: boolean("is_active").default(true).notNull(),
  openingBalance: decimal("opening_balance", { precision: 14, scale: 2 })
    .default("0")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});

export const journalEntries = mysqlTable("journal_entries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  entryNumber: varchar("entry_number", { length: 50 }).notNull().unique(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  referenceType: varchar("reference_type", { length: 50 }),
  referenceId: varchar("reference_id", { length: 255 }),
  status: mysqlEnum("status", ["draft", "posted", "voided"])
    .default("draft")
    .notNull(),
  totalDebit: decimal("total_debit", { precision: 14, scale: 2 })
    .default("0")
    .notNull(),
  totalCredit: decimal("total_credit", { precision: 14, scale: 2 })
    .default("0")
    .notNull(),
  createdBy: int("created_by").references(() => users.id),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});

export const journalEntryLines = mysqlTable("journal_entry_lines", {
  id: varchar("id", { length: 36 }).primaryKey(),
  journalEntryId: varchar("journal_entry_id", { length: 36 })
    .notNull()
    .references(() => journalEntries.id, { onDelete: "cascade" }),
  accountId: varchar("account_id", { length: 36 })
    .notNull()
    .references(() => chartOfAccounts.id),
  debit: decimal("debit", { precision: 14, scale: 2 }).default("0").notNull(),
  credit: decimal("credit", { precision: 14, scale: 2 }).default("0").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accountBalances = mysqlTable("account_balances", {
  id: varchar("id", { length: 36 }).primaryKey(),
  accountId: varchar("account_id", { length: 36 })
    .notNull()
    .references(() => chartOfAccounts.id),
  period: varchar("period", { length: 10 }).notNull(),
  debitTotal: decimal("debit_total", { precision: 14, scale: 2 })
    .default("0")
    .notNull(),
  creditTotal: decimal("credit_total", { precision: 14, scale: 2 })
    .default("0")
    .notNull(),
  balance: decimal("balance", { precision: 14, scale: 2 }).default("0").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type NewChartOfAccount = typeof chartOfAccounts.$inferInsert;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;
export type JournalEntryLine = typeof journalEntryLines.$inferSelect;
export type NewJournalEntryLine = typeof journalEntryLines.$inferInsert;
export type AccountBalance = typeof accountBalances.$inferSelect;
export type NewAccountBalance = typeof accountBalances.$inferInsert;
