import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { supportTickets, supportTicketReplies, users, type NewSupportTicket, type SupportTicket } from "@/db/schemas";

export type TicketUser = {
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

export type SupportTicketReplyWithUser = {
  id: number;
  ticketId: number | null;
  userId: number | null;
  senderName: string | null;
  message: string;
  createdAt: Date | string;
};

export type SupportTicketWithUser = SupportTicket & {
  user: TicketUser | null;
};

const ticketColumns = {
  id: supportTickets.id,
  userId: supportTickets.userId,
  subject: supportTickets.subject,
  message: supportTickets.message,
  status: supportTickets.status,
  priority: supportTickets.priority,
  resolutionNote: supportTickets.resolutionNote,
  createdAt: supportTickets.createdAt,
  updatedAt: supportTickets.updatedAt,
  userName: users.name,
  userEmail: users.email,
  userPhone: users.phone,
  userAddress: users.address,
} as const;

type TicketRow = {
  id: number;
  userId: number | null;
  subject: string;
  message: string;
  status: string;
  priority: string;
  resolutionNote: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  userAddress: string | null;
};

function toTicketWithUser(r: TicketRow): SupportTicketWithUser {
  const user: TicketUser | null =
    r.userName || r.userEmail || r.userPhone || r.userAddress
      ? { name: r.userName, email: r.userEmail, phone: r.userPhone, address: r.userAddress }
      : null;
  return {
    id: r.id,
    userId: r.userId,
    subject: r.subject,
    message: r.message,
    status: r.status as SupportTicket["status"],
    priority: r.priority as SupportTicket["priority"],
    resolutionNote: r.resolutionNote,
    createdAt: r.createdAt as Date,
    updatedAt: r.updatedAt as Date,
    user,
  };
}

export async function getSupportTickets() {
  return db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
}

export async function getSupportTicketsWithUsers(): Promise<SupportTicketWithUser[]> {
  const rows = await db
    .select(ticketColumns)
    .from(supportTickets)
    .leftJoin(users, eq(supportTickets.userId, users.id))
    .orderBy(desc(supportTickets.createdAt));
  return rows.map(toTicketWithUser);
}

export async function getSupportTicketById(id: number) {
  const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
  return ticket ?? null;
}

export async function getSupportTicketsByUser(userId: number): Promise<SupportTicketWithUser[]> {
  const rows = await db
    .select(ticketColumns)
    .from(supportTickets)
    .leftJoin(users, eq(supportTickets.userId, users.id))
    .where(eq(supportTickets.userId, userId))
    .orderBy(desc(supportTickets.createdAt));
  return rows.map(toTicketWithUser);
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

export async function getRepliesByTicket(ticketId: number): Promise<SupportTicketReplyWithUser[]> {
  const rows = await db
    .select({
      id: supportTicketReplies.id,
      ticketId: supportTicketReplies.ticketId,
      userId: supportTicketReplies.userId,
      message: supportTicketReplies.message,
      createdAt: supportTicketReplies.createdAt,
      senderName: users.name,
    })
    .from(supportTicketReplies)
    .leftJoin(users, eq(supportTicketReplies.userId, users.id))
    .where(eq(supportTicketReplies.ticketId, ticketId))
    .orderBy(desc(supportTicketReplies.createdAt));

  return rows.map((r) => ({
    id: r.id,
    ticketId: r.ticketId,
    userId: r.userId,
    senderName: r.senderName,
    message: r.message,
    createdAt: r.createdAt as Date,
  }));
}

export async function createReply(reply: { ticketId: number; userId: number | null; message: string }) {
  const result = await db.insert(supportTicketReplies).values(reply);
  return result[0].insertId;
}
