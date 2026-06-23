import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import { getContactMessages, deleteContactMessage } from "@/db/services/contact-messages";

export async function GET() {
  await requirePermission(PERMISSIONS.VIEW_MESSAGES);

  try {
    const messages = await getContactMessages();
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to fetch messages", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  await requirePermission(PERMISSIONS.DELETE_MESSAGES);

  try {
    const { id } = (await request.json()) as { id: number };
    if (!id) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
    }
    await deleteContactMessage(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete message", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
