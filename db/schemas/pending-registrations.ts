import {
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const pendingRegistrations = mysqlTable("pending_registrations", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 180 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  address: varchar("address", { length: 255 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  roleId: int("role_id"),
  otp: varchar("otp", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
