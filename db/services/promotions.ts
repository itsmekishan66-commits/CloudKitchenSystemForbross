import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { promotions, type NewPromotion } from "@/db/schemas";

export async function getPromotions() {
  return db.select().from(promotions).orderBy(desc(promotions.createdAt));
}

export async function getActivePromotions() {
  return db.select().from(promotions).where(eq(promotions.isActive, true)).orderBy(desc(promotions.createdAt));
}

export async function getPromotionById(id: number) {
  const [promotion] = await db.select().from(promotions).where(eq(promotions.id, id)).limit(1);
  return promotion ?? null;
}

export async function getActivePromotionByCode(code: string) {
  const normalized = code.trim().toLowerCase();
  const [promotion] = await db
    .select()
    .from(promotions)
    .where(sql`lower(${promotions.code}) = ${normalized}`)
    .limit(1);

  return promotion ?? null;
}

export async function incrementPromotionUsage(id: number) {
  await db
    .update(promotions)
    .set({ usageCount: sql`${promotions.usageCount} + 1` })
    .where(eq(promotions.id, id));
}

export async function createPromotion(promotion: NewPromotion) {
  const result = await db.insert(promotions).values(promotion);
  return result[0].insertId;
}

export async function updatePromotion(id: number, promotion: Partial<NewPromotion>) {
  await db.update(promotions).set(promotion).where(eq(promotions.id, id));
}

export async function deletePromotion(id: number) {
  await db.delete(promotions).where(eq(promotions.id, id));
}
