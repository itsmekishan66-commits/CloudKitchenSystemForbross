import { int, json, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { users } from "./users";

export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }),
  entityId: int("entity_id"),
  details: json("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
