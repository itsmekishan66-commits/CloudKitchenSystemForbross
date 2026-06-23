import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserOrderStats, getUserFavoriteItems } from "@/db/services/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await getUserOrderStats(user.id);
    const favorites = await getUserFavoriteItems(user.id);

    return NextResponse.json({
      totalOrders: stats.totalOrders,
      totalSpent: stats.totalSpent,
      activeOrders: stats.activeOrders,
      favoriteItems: favorites.length,
    });
  } catch (error) {
    console.error("Failed to load dashboard stats", error);
    return NextResponse.json({ error: "Unable to load stats" }, { status: 500 });
  }
}
