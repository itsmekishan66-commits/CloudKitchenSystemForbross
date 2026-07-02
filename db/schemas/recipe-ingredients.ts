// this is the code for menu recipe - recipe_ingredients junction table
import { decimal, int, mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { recipes } from "./recipes";
import { inventoryItems } from "./inventory";

export const recipeIngredients = mysqlTable("recipe_ingredients", {
  id: int("id").autoincrement().primaryKey(),
  recipeId: int("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  inventoryItemId: int("inventory_item_id").notNull().references(() => inventoryItems.id, { onDelete: "restrict" }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  unit: varchar("unit", { length: 40 }).notNull(),
  notes: varchar("notes", { length: 255 }),
});

export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type NewRecipeIngredient = typeof recipeIngredients.$inferInsert;
