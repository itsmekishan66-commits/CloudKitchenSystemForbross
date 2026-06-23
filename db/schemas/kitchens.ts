import { boolean, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const kitchens = mysqlTable("kitchens", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  location: varchar("location", { length: 255 }),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 180 }),
  managerName: varchar("manager_name", { length: 160 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type Kitchen = typeof kitchens.$inferSelect;
export type NewKitchen = typeof kitchens.$inferInsert;
