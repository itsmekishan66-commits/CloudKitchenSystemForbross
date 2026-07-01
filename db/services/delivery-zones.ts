// import { and } from "drizzle-orm";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { deliveryZones, type NewDeliveryZone } from "@/db/schemas";

export async function getActiveZones() {
  return db.select().from(deliveryZones).where(eq(deliveryZones.isActive, true)).orderBy(desc(deliveryZones.createdAt));
}

export async function getAllZones() {
  return db.select().from(deliveryZones).orderBy(desc(deliveryZones.createdAt));
}

export async function getZoneById(id: number) {
  const [zone] = await db.select().from(deliveryZones).where(eq(deliveryZones.id, id)).limit(1);
  return zone ?? null;
}

export async function createZone(data: NewDeliveryZone) {
  const result = await db.insert(deliveryZones).values(data);
  return result[0].insertId;
}

export async function updateZone(id: number, data: Partial<NewDeliveryZone>) {
  await db.update(deliveryZones).set(data).where(eq(deliveryZones.id, id));
}

export async function toggleZoneStatus(id: number) {
  const zone = await getZoneById(id);
  if (!zone) return null;
  await db.update(deliveryZones).set({ isActive: !zone.isActive }).where(eq(deliveryZones.id, id));
  return !zone.isActive;
}

export async function deleteZone(id: number) {
  await db.delete(deliveryZones).where(eq(deliveryZones.id, id));
}