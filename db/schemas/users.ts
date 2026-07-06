import {
  boolean,
  int,
  mysqlTable,
  timestamp,
  decimal,
  varchar,
} from "drizzle-orm/mysql-core";
import { roles } from "./roles";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 180 }),
  phone: varchar("phone", { length: 40 }),
  address: varchar("address", { length: 255 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  roleId: int("role_id").references(() => roles.id),
  isGuest: boolean("is_guest").notNull().default(false),
  creditBalance: decimal("credit_balance_over_paid", { precision: 10, scale: 2 }).default("0"),
  deleted: boolean("deleted").notNull().default(false),
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationOtp: varchar("verification_otp", { length: 6 }),
  verificationOtpExpires: timestamp("verification_otp_expires"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
