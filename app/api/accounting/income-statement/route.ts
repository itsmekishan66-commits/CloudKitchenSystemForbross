import { NextResponse } from "next/server";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { getIncomeStatement } from "@/db/services/accounting";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_ACCOUNTING);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const startDate =
      searchParams.get("startDate") ||
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .substring(0, 10);
    const endDate =
      searchParams.get("endDate") || new Date().toISOString().substring(0, 10);

    const statement = await getIncomeStatement(startDate, endDate);
    return NextResponse.json(statement);
  } catch (error) {
    console.error("Failed to generate income statement:", error);
    return NextResponse.json(
      { error: "Failed to generate income statement" },
      { status: 500 }
    );
  }
}
