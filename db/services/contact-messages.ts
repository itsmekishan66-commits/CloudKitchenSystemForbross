import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages, type NewContactMessage } from "@/db/schemas/contact-messages";

export async function createContactMessage(data: NewContactMessage) {
  const result = await db.insert(contactMessages).values(data);
  return result[0].insertId;
}

export async function getContactMessages() {
  return db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt));
}

export async function getContactMessageById(id: number) {
  const [msg] = await db
    .select()
    .from(contactMessages)
    .where(eq(contactMessages.id, id))
    .limit(1);
  return msg ?? null;
}

export async function deleteContactMessage(id: number) {
  await db.delete(contactMessages).where(eq(contactMessages.id, id));
}
