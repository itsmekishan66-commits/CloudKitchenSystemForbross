import { NextResponse } from "next/server";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { getAccountingOverview, ensureStandardAccounts } from "@/db/services/accounting";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_ACCOUNTING);
    if (user instanceof NextResponse) return user;

    await ensureStandardAccounts();
    const overview = await getAccountingOverview();
    return NextResponse.json(overview);
  } catch (error) {
    console.error("Failed to load accounting overview:", error);
    return NextResponse.json(
      { error: "Failed to load accounting overview" },
      { status: 500 }
    );
  }
}
