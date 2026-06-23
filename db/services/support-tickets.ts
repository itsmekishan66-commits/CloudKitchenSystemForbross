import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { supportTickets, type NewSupportTicket } from "@/db/schemas";

export async function getSupportTickets() {
  return db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
}

export async function getSupportTicketById(id: number) {
  const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
  return ticket ?? null;
}

export async function createSupportTicket(ticket: NewSupportTicket) {
  const result = await db.insert(supportTickets).values(ticket);
  return result[0].insertId;
}

export async function updateSupportTicket(id: number, ticket: Partial<NewSupportTicket>) {
  await db.update(supportTickets).set(ticket).where(eq(supportTickets.id, id));
}

export async function deleteSupportTicket(id: number) {
  await db.delete(supportTickets).where(eq(supportTickets.id, id));
}
