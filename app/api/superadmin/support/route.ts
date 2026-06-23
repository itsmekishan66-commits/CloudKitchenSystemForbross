import { NextResponse } from "next/server";

import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import {
  getSupportTickets,
  getSupportTicketById,
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
      return NextResponse.json({ ticket });
    }

    const tickets = await getSupportTickets();
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
      assignedTo: cleanText(body.assignedTo) || null,
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

    await updateSupportTicket(id, {
      subject: body.subject,
      message: body.message,
      status: body.status,
      priority: body.priority,
      assignedTo: body.assignedTo,
    });

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
