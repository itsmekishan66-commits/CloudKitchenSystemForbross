import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { users } from "./users";

export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").references(() => users.id, { onDelete: "set null" }),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["Open", "In Progress", "Resolved", "Closed"])
    .notNull().default("Open"),
  priority: mysqlEnum("priority", ["Low", "Medium", "High", "Urgent"])
    .notNull().default("Medium"),
  assignedTo: varchar("assigned_to", { length: 160 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type NewSupportTicket = typeof supportTickets.$inferInsert;
