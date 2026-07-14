import { decimal, int, mysqlTable, text, timestamp } from "drizzle-orm/mysql-core";
import { menuItems } from "./menu-items";

export const cookedFoodStock = mysqlTable("cooked_food_stock", {
  id: int("id").autoincrement().primaryKey(),
  menuItemId: int("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  minStockLevel: decimal("min_stock_level", { precision: 10, scale: 2 }).notNull().default("0"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type CookedFoodStock = typeof cookedFoodStock.$inferSelect;
export type NewCookedFoodStock = typeof cookedFoodStock.$inferInsert;
