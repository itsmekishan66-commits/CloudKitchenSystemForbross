import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getSupportTicketById, getRepliesByTicket, createReply } from "@/db/services/support-tickets";

export const dynamic = "force-dynamic";

async function ownedTicket(user: { id: number }, ticketId: number) {
  const ticket = await getSupportTicketById(ticketId);
  if (!ticket || ticket.userId !== user.id) return null;
  return ticket;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId)) {
    return NextResponse.json({ error: "Invalid ticket id" }, { status: 400 });
  }

  const ticket = await ownedTicket(user, ticketId);
  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const replies = await getRepliesByTicket(ticketId);
    return NextResponse.json({ replies });
  } catch (error) {
    console.error("Failed to load replies", error);
    return NextResponse.json({ error: "Unable to load replies" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId)) {
    return NextResponse.json({ error: "Invalid ticket id" }, { status: 400 });
  }

  const ticket = await ownedTicket(user, ticketId);
  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    if (ticket.status === "Resolved" || ticket.status === "Closed") {
      return NextResponse.json(
        { error: "This ticket is closed. Please create a new ticket for further issues." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as { message?: string };
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const replyId = await createReply({
      ticketId,
      userId: user.id,
      message,
    });

    return NextResponse.json({ replyId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create reply", error);
    return NextResponse.json({ error: "Unable to create reply" }, { status: 500 });
  }
}
