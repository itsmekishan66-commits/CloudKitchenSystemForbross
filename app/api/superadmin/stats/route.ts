import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { orders, users, roles, menuItems, kitchens } from "@/db/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.VIEW_REPORTS
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const [orderStats] = await db
      .select({
        totalOrders: sql<number>`count(*)`,
        revenue: sql<string>`coalesce(sum(${orders.total}), 0)`,
      })
      .from(orders);

    const [customerCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(roles.name, "customer"));

    const [menuCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(menuItems);

    const [kitchenCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(kitchens)
      .where(eq(kitchens.isActive, true));

    const [adminCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(sql`${roles.name} in ('admin', 'staff')`);

    const [pendingOrders] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(sql`${orders.status} in ('Pending', 'Preparing', 'Out For Delivery')`);

    const recentOrders = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        status: orders.status,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(sql`${orders.createdAt} desc`)
      .limit(10);

    return NextResponse.json({
      totalOrders: Number(orderStats?.totalOrders ?? 0),
      revenue: Number(orderStats?.revenue ?? 0),
      totalCustomers: Number(customerCount?.count ?? 0),
      totalMenuItems: Number(menuCount?.count ?? 0),
      activeKitchens: Number(kitchenCount?.count ?? 0),
      totalAdmins: Number(adminCount?.count ?? 0),
      pendingOrders: Number(pendingOrders?.count ?? 0),
      recentOrders,
    });
  } catch (error) {
    console.error("Failed to load dashboard stats", error);
    return NextResponse.json({ error: "Unable to load dashboard stats" }, { status: 500 });
  }
}
