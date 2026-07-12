import { NextResponse } from "next/server";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { postJournalEntry } from "@/db/services/accounting";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_ACCOUNTING);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const entry = await postJournalEntry(id);
    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Failed to post journal entry:", error);
    const message =
      error instanceof Error ? error.message : "Failed to post journal entry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
