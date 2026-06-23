import {
  boolean,
  decimal,
  int,
  json,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

import { categories } from "./categories";

export const menuItems = mysqlTable("menu_items", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  title: varchar("title", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  image: varchar("image", { length: 255 }),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  badge: varchar("badge", { length: 80 }),
  rating: decimal("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  reviews: int("reviews").notNull().default(0),
  isAvailable: boolean("is_available").notNull().default(true),
  addons: json("addons"),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;
