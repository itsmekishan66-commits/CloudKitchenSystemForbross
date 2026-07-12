import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { orders, users, roles, menuItems, kitchens } from "@/db/schemas";

export const dynamic = "force-dynamic";

const getDashboardStats = unstable_cache(
  async () => {
    const [
      [orderStats],
      [customerCount],
      [menuCount],
      [kitchenCount],
      [adminCount],
      [pendingOrders],
      recentOrders,
    ] = await Promise.all([
      db
        .select({
          totalOrders: sql<number>`count(*)`,
          revenue: sql<string>`coalesce(sum(${orders.total}), 0)`,
        })
        .from(orders),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(and(eq(roles.name, "customer"), eq(users.deleted, false))),
      db.select({ count: sql<number>`count(*)` }).from(menuItems),
      db
        .select({ count: sql<number>`count(*)` })
        .from(kitchens)
        .where(eq(kitchens.isActive, true)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(and(sql`${roles.name} not in ('customer')`, eq(users.deleted, false))),
      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(sql`${orders.status} in ('Pending', 'Preparing', 'Out For Delivery')`),
      db
        .select({
          id: orders.id,
          customerName: orders.customerName,
          status: orders.status,
          total: orders.total,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .orderBy(sql`${orders.createdAt} desc`)
        .limit(20),
    ]);

    return {
      totalOrders: Number(orderStats?.totalOrders ?? 0),
      revenue: Number(orderStats?.revenue ?? 0),
      totalCustomers: Number(customerCount?.count ?? 0),
      totalMenuItems: Number(menuCount?.count ?? 0),
      activeKitchens: Number(kitchenCount?.count ?? 0),
      totalAdmins: Number(adminCount?.count ?? 0),
      pendingOrders: Number(pendingOrders?.count ?? 0),
      recentOrders,
    };
  },
  ["dashboard-stats"],
  { revalidate: 60, tags: ["dashboard-stats"] }
);

export async function GET() {
  try {
    // RBAC check — VIEW_DASHBOARD gates the dashboard page; sections are filtered client-side
    const user = await apiRequirePermissions(
      PERMISSIONS.VIEW_DASHBOARD
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const stats = await getDashboardStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to load dashboard stats", error);
    return NextResponse.json({ error: "Unable to load dashboard stats" }, { status: 500 });
  }
}
