import {
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }),
  email: varchar("email", { length: 180 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  subject: varchar("subject", { length: 255 }),
  message: text("message"),
  source: varchar("source", { length: 20 }).notNull().default("contact"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;
