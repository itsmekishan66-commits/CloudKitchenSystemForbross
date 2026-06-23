import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";

import {
  orders,
  users,
  roles,
  menuItems,
  orderItems,
} from "@/db/schemas";

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

    // Order statistics
    const [orderStats] = await db
      .select({
        totalOrders: sql<number>`count(*)`,
        totalRevenue: sql<string>`
          coalesce(sum(${orders.total}),0)
        `,
        avgOrderValue: sql<string>`
          coalesce(avg(${orders.total}),0)
        `,
      })
      .from(orders);

    // Customer statistics
    const [customerStats] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(users)
      .leftJoin(
        roles,
        eq(users.roleId, roles.id)
      )
      .where(
        eq(roles.name, "customer")
      );

    // Menu statistics
    const [menuStats] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(menuItems);

    // Order status breakdown
    const statusBreakdown = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
        revenue: sql<string>`
          coalesce(sum(${orders.total}),0)
        `,
      })
      .from(orders)
      .groupBy(orders.status);

    // Popular items
    const popularItems = await db
      .select({
        title: orderItems.title,
        totalQuantity: sql<number>`
          sum(${orderItems.quantity})
        `,
        totalRevenue: sql<string>`
          coalesce(
            sum(
              ${orderItems.price} * ${orderItems.quantity}
            ),
            0
          )
        `,
      })
      .from(orderItems)
      .groupBy(orderItems.title)
      .orderBy(
        sql`sum(${orderItems.quantity}) desc`
      )
      .limit(10);

    return NextResponse.json({
      totalOrders: Number(
        orderStats?.totalOrders ?? 0
      ),

      totalRevenue: Number(
        orderStats?.totalRevenue ?? 0
      ),

      avgOrderValue: Number(
        orderStats?.avgOrderValue ?? 0
      ),

      totalCustomers: Number(
        customerStats?.count ?? 0
      ),

      totalMenuItems: Number(
        menuStats?.count ?? 0
      ),

      statusBreakdown: statusBreakdown.map(
        (item) => ({
          status: item.status,
          count: Number(item.count),
          revenue: Number(item.revenue),
        })
      ),

      popularItems: popularItems.map(
        (item) => ({
          title: item.title,
          totalQuantity: Number(
            item.totalQuantity
          ),
          totalRevenue: Number(
            item.totalRevenue
          ),
        })
      ),
    });

  } catch (error) {
    console.error(
      "Failed to load reports:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load reports",
      },
      {
        status: 500,
      }
    );
  }
}