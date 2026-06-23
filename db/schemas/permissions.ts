import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const permissions = mysqlTable("permissions", {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: varchar("description", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});


export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;