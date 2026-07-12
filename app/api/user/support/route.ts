import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getSupportTicketsByUser,
  createSupportTicket,
} from "@/db/services/support-tickets";
import { createActivityLog } from "@/db/services/activity-logs";
import type { NewSupportTicket } from "@/db/schemas";

export const dynamic = "force-dynamic";

const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tickets = await getSupportTicketsByUser(user.id);
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Failed to load support tickets", error);
    return NextResponse.json({ error: "Unable to load support tickets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<NewSupportTicket>;
    const subject = cleanText(body.subject);
    const message = cleanText(body.message);
    const priorityRaw = cleanText(body.priority);
    const priority = (PRIORITIES as readonly string[]).includes(priorityRaw)
      ? (priorityRaw as (typeof PRIORITIES)[number])
      : "Medium";

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    const ticketId = await createSupportTicket({
      userId: user.id,
      subject,
      message,
      priority,
      status: "Open",
    });

    await createActivityLog({
      userId: user.id,
      action: `Created support ticket: ${subject}`,
      entityType: "support_ticket",
      entityId: ticketId,
    });

    return NextResponse.json({ ticketId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create support ticket", error);
    return NextResponse.json({ error: "Unable to create support ticket" }, { status: 500 });
  }
}
