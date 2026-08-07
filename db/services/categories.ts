import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { categories, type NewCategory } from "@/db/schemas";

export async function getCategories() {
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function getActiveCategories() {
  return db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.name));
}

export async function getCategoriesByType(type: 'menu' | 'inventory') {
  return db.select().from(categories)
    .where(and(eq(categories.isActive, true), eq(categories.type, type)))
    .orderBy(asc(categories.name));
}

export async function createCategory(category: NewCategory) {
  const result = await db.insert(categories).values(category);
  return result[0].insertId;
}

export async function updateCategory(id: number, category: Partial<NewCategory>) {
  await db.update(categories).set(category).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  await db.delete(categories).where(eq(categories.id, id));
}
