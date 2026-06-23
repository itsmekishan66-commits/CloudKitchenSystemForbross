import { decimal, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { kitchens } from "./kitchens";

export const inventoryItems = mysqlTable("inventory_items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 80 }).notNull().default("Other"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  unit: varchar("unit", { length: 40 }).notNull().default("pcs"),
  minStockLevel: decimal("min_stock_level", { precision: 10, scale: 2 }).notNull().default("0"),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }).notNull().default("0"),
  kitchenId: int("kitchen_id").references(() => kitchens.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;
