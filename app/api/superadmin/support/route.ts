import { NextResponse } from "next/server";

import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import {
  getSupportTicketsWithUsers,
  getSupportTicketById,
  getRepliesByTicket,
  createSupportTicket,
  updateSupportTicket,
  deleteSupportTicket,
} from "@/db/services/support-tickets";
import type { NewSupportTicket } from "@/db/schemas";
import { createActivityLog } from "@/db/services/activity-logs";

export const dynamic = "force-dynamic";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.VIEW_SUPPORTS
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const ticket = await getSupportTicketById(Number(id));
      if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const replies = await getRepliesByTicket(Number(id));
      return NextResponse.json({ ticket, replies });
    }

    const tickets = await getSupportTicketsWithUsers();
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Failed to load support tickets", error);
    return NextResponse.json({ error: "Unable to load support tickets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.CREATE_SUPPORTS
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const body = (await request.json()) as NewSupportTicket;
    const subject = cleanText(body.subject);
    const message = cleanText(body.message);

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    const ticketId = await createSupportTicket({
      ...body,
      userId: body.userId ?? user.id,
      subject,
      message,
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

export async function PATCH(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.UPDATE_SUPPORTS
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const body = (await request.json()) as NewSupportTicket & { id: number };
    const id = Number(body.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    const existing = await getSupportTicketById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // A resolved or closed ticket cannot be reopened
    if (
      (existing.status === "Resolved" || existing.status === "Closed") &&
      body.status !== undefined &&
      body.status !== existing.status
    ) {
      return NextResponse.json(
        { error: "A resolved or closed ticket cannot be reopened" },
        { status: 403 },
      );
    }

    const update: Partial<NewSupportTicket> = {};
    if (body.subject !== undefined) update.subject = body.subject;
    if (body.message !== undefined) update.message = body.message;
    if (body.status !== undefined) update.status = body.status;
    if (body.priority !== undefined) update.priority = body.priority;
    if (body.resolutionNote !== undefined) update.resolutionNote = body.resolutionNote;

    await updateSupportTicket(id, update);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update support ticket", error);
    return NextResponse.json({ error: "Unable to update support ticket" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.DELETE_SUPPORTS
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    await deleteSupportTicket(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete support ticket", error);
    return NextResponse.json({ error: "Unable to delete support ticket" }, { status: 500 });
  }
}
