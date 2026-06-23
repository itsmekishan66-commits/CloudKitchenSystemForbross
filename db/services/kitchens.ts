import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { kitchens, type NewKitchen } from "@/db/schemas";

export async function getKitchens() {
  return db.select().from(kitchens).orderBy(asc(kitchens.name));
}

export async function getActiveKitchens() {
  return db.select().from(kitchens).where(eq(kitchens.isActive, true)).orderBy(asc(kitchens.name));
}

export async function getKitchenById(id: number) {
  const [kitchen] = await db.select().from(kitchens).where(eq(kitchens.id, id)).limit(1);
  return kitchen ?? null;
}

export async function createKitchen(kitchen: NewKitchen) {
  const result = await db.insert(kitchens).values(kitchen);
  return result[0].insertId;
}

export async function updateKitchen(id: number, kitchen: Partial<NewKitchen>) {
  await db.update(kitchens).set(kitchen).where(eq(kitchens.id, id));
}

export async function deleteKitchen(id: number) {
  await db.delete(kitchens).where(eq(kitchens.id, id));
}
