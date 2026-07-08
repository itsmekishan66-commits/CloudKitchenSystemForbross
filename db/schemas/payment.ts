import { int, mysqlTable, varchar, decimal, timestamp, mysqlEnum, text } from "drizzle-orm/mysql-core";

export const transactions = mysqlTable("transactions", {
    id: varchar("id", { length: 36 }).primaryKey(),
    type: mysqlEnum("type", [
        "cash_received", "cash_paid", "online_received", "online_paid",
        "expense", "bank_transfer", "refund"]).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    receivedFrom: varchar("received_from", { length: 255 }),
    paidTo: varchar("paid_to", { length: 255 }),
    paymentMethod: mysqlEnum("payment_method", ["cash", "bank", "esewa", "khalti", "fonepay", "card"]).notNull(),
    accountId: varchar("account_id", { length: 36 }),
    transactionId: varchar("transaction_id", { length: 255 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
});

export const dues = mysqlTable("dues", {
    id: varchar("id", { length: 36 }).primaryKey(),
    personName: varchar("person_name", { length: 255 }).notNull(),
    orderId: int("order_id"),
    role: mysqlEnum("role", ["customer", "supplier", "staff"]).notNull(),
    totalDue: decimal("total_due", { precision: 10, scale: 2 }).notNull().default("0"),
    paid: decimal("paid", { precision: 10, scale: 2 }).notNull().default("0"),
    remaining: decimal("remaining", { precision: 10, scale: 2 }).notNull().default("0"),
    status: mysqlEnum("status", ["pending", "partial", "paid"]).notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
});

export const paymentAccounts = mysqlTable("payment_accounts", {
    id: varchar("id", { length: 36 }).primaryKey(),
    accountName: varchar("account_name", { length: 255 }).notNull(),
    holderName: varchar("holder_name", { length: 255 }).notNull(),
    method: mysqlEnum("method", ["esewa", "khalti", "netbanking", "card"]).notNull(),
    accountNumber: varchar("account_number", { length: 255 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 20 }),
    bankName: varchar("bank_name", { length: 255 }),
    branch: varchar("branch", { length: 255 }),
    openingBalance: decimal("opening_balance", { precision: 10, scale: 2 }).default("0"),
    qrCode: varchar("qr_code", { length: 500 }),
    notes: text("notes"),
    status: mysqlEnum("status", ["active", "inactive"]).default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Due = typeof dues.$inferSelect;
export type NewDue = typeof dues.$inferInsert;
