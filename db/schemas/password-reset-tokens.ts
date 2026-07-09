import {
  boolean,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 180 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;