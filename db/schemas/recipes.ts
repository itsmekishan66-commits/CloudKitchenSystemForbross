// this is the code for menu recipe - recipes table
import { boolean, int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { menuItems } from "./menu-items";

export const recipes = mysqlTable("recipes", {
  id: int("id").autoincrement().primaryKey(),
  menuItemId: int("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  prepTime: varchar("prep_time", { length: 50 }),
  cookTime: varchar("cook_time", { length: 50 }),
  servings: int("servings").notNull().default(1),
  image: varchar("image", { length: 2048 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
