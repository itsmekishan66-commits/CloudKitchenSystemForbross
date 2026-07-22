import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getTrialBalance } from "@/db/services/accounting";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_ACCOUNTING);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const asOfDate =
      searchParams.get("asOfDate") || new Date().toISOString().substring(0, 10);

    const getCachedTrialBalance = unstable_cache(
      (date: string) => getTrialBalance(date),
      [CACHE_TAGS.TRIAL_BALANCE, asOfDate],
      { revalidate: 120, tags: [CACHE_TAGS.TRIAL_BALANCE] }
    );

    const trialBalance = await getCachedTrialBalance(asOfDate);
    return NextResponse.json(trialBalance);
  } catch (error) {
    console.error("Failed to generate trial balance:", error);
    return NextResponse.json(
      { error: "Failed to generate trial balance" },
      { status: 500 }
    );
  }
}
