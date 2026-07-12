import { NextResponse } from "next/server";

import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { getRepliesByTicket, getSupportTicketById, createReply } from "@/db/services/support-tickets";
import { createActivityLog } from "@/db/services/activity-logs";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_SUPPORTS);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const ticketId = Number(id);
    if (!Number.isInteger(ticketId)) {
      return NextResponse.json({ error: "Invalid ticket id" }, { status: 400 });
    }

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
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_SUPPORTS);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const ticketId = Number(id);
    if (!Number.isInteger(ticketId)) {
      return NextResponse.json({ error: "Invalid ticket id" }, { status: 400 });
    }

    const ticket = await getSupportTicketById(ticketId);
    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // No further replies once a ticket is resolved or closed
    if (ticket.status === "Resolved" || ticket.status === "Closed") {
      return NextResponse.json(
        { error: "This ticket is closed. No further replies can be added." },
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

    await createActivityLog({
      userId: user.id,
      action: `Replied to support ticket #${ticketId}`,
      entityType: "support_ticket",
      entityId: ticketId,
    });

    return NextResponse.json({ replyId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create reply", error);
    return NextResponse.json({ error: "Unable to create reply" }, { status: 500 });
  }
}
