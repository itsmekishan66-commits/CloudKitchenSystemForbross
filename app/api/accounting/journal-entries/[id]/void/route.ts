import { NextResponse } from "next/server";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { voidJournalEntry } from "@/db/services/accounting";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_ACCOUNTING);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "Reason for voiding is required" },
        { status: 400 }
      );
    }

    const entry = await voidJournalEntry(id, reason);
    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Failed to void journal entry:", error);
    const message =
      error instanceof Error ? error.message : "Failed to void journal entry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
