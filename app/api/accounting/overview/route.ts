import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getAccountingOverview, ensureStandardAccounts } from "@/db/services/accounting";

export const dynamic = "force-dynamic";

const fetchOverview = async () => {
  await ensureStandardAccounts();
  return getAccountingOverview();
};

export async function GET() {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_ACCOUNTING);
    if (user instanceof NextResponse) return user;

    const getCachedOverview = unstable_cache(
      fetchOverview,
      [CACHE_TAGS.ACCOUNTING_OVERVIEW],
      { revalidate: 120, tags: [CACHE_TAGS.ACCOUNTING_OVERVIEW] }
    );

    const overview = await getCachedOverview();
    return NextResponse.json(overview);
  } catch (error) {
    console.error("Failed to load accounting overview:", error);
    return NextResponse.json(
      { error: "Failed to load accounting overview" },
      { status: 500 }
    );
  }
}
