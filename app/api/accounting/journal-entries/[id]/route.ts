import { NextResponse } from "next/server";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { getJournalEntryById } from "@/db/services/accounting";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_ACCOUNTING);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const entry = await getJournalEntryById(id);
    if (!entry) {
      return NextResponse.json(
        { error: "Journal entry not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Failed to load journal entry:", error);
    return NextResponse.json(
      { error: "Failed to load journal entry" },
      { status: 500 }
    );
  }
}
