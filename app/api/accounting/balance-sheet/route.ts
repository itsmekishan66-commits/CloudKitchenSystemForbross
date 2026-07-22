import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getBalanceSheet } from "@/db/services/accounting";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_ACCOUNTING);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const asOfDate =
      searchParams.get("asOfDate") || new Date().toISOString().substring(0, 10);

    const getCachedStatement = unstable_cache(
      (date: string) => getBalanceSheet(date),
      [CACHE_TAGS.BALANCE_SHEET, asOfDate],
      { revalidate: 120, tags: [CACHE_TAGS.BALANCE_SHEET] }
    );

    const statement = await getCachedStatement(asOfDate);
    return NextResponse.json(statement);
  } catch (error) {
    console.error("Failed to generate balance sheet:", error);
    return NextResponse.json(
      { error: "Failed to generate balance sheet" },
      { status: 500 }
    );
  }
}
