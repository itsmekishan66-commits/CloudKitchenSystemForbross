import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { inventoryItems, type NewInventoryItem } from "@/db/schemas";

export async function getInventoryItems() {
  return db.select().from(inventoryItems).orderBy(asc(inventoryItems.name));
}

export async function getInventoryItemsByKitchen(kitchenId: number) {
  return db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.kitchenId, kitchenId))
    .orderBy(asc(inventoryItems.name));
}

export async function getLowStockItems() {
  return db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.quantity, inventoryItems.minStockLevel))
    .orderBy(asc(inventoryItems.name));
}

export async function getInventoryItemById(id: number) {
  const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).limit(1);
  return item ?? null;
}

export async function createInventoryItem(item: NewInventoryItem) {
  const result = await db.insert(inventoryItems).values(item);
  return result[0].insertId;
}

export async function updateInventoryItem(id: number, item: Partial<NewInventoryItem>) {
  await db.update(inventoryItems).set(item).where(eq(inventoryItems.id, id));
}

export async function deleteInventoryItem(id: number) {
  await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
}
