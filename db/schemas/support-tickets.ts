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
  resolutionNote: text("resolution_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const supportTicketReplies = mysqlTable("support_ticket_replies", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticket_id").references(() => supportTickets.id, { onDelete: "cascade" }),
  userId: int("user_id").references(() => users.id, { onDelete: "set null" }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type NewSupportTicket = typeof supportTickets.$inferInsert;
export type SupportTicketReply = typeof supportTicketReplies.$inferSelect;
export type NewSupportTicketReply = typeof supportTicketReplies.$inferInsert;
