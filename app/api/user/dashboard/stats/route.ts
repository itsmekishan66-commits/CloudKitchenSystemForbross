import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getUserOrderStats, getUserFavoriteItems } from "@/db/services/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fetchStats = async () => {
      const stats = await getUserOrderStats(user.id);
      const favorites = await getUserFavoriteItems(user.id);

      return {
        totalOrders: stats.totalOrders,
        totalSpent: stats.totalSpent,
        totalSaved: stats.totalSaved,
        totalDues: stats.totalDues,
        activeOrders: stats.activeOrders,
        creditBalance: stats.creditBalance,
        favoriteItems: favorites.length,
      };
    };

    const getCachedStats = unstable_cache(
      fetchStats,
      [CACHE_TAGS.USER_STATS, String(user.id)],
      { revalidate: 30, tags: [CACHE_TAGS.USER_STATS] }
    );

    const stats = await getCachedStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to load dashboard stats", error);
    return NextResponse.json({ error: "Unable to load stats" }, { status: 500 });
  }
}
