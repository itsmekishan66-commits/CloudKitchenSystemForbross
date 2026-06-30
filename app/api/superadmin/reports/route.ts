import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";

import {
  orders,
  orderItems,
  users,
  roles,
  menuItems,
  categories,
  transactions,
} from "@/db/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_REPORTS);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("range") || "30", 10);
    const intervalDays = isNaN(days) || days <= 0 ? 30 : days;

    const run = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
      try { return await fn(); } catch { return fallback; }
    };

    const [
      orderStats,
      customerStats,
      menuStats,
      totalExpensesResult,
      revenueOverTime,
      expensesOverTime,
      ordersOverTime,
      peakHours,
      peakDays,
      popularItems,
      categorySales,
      customerGrowth,
      statusBreakdown,
    ] = await Promise.all([
      run(() => db.select({
        totalOrders: sql<number>`count(*)`,
        totalRevenue: sql<string>`coalesce(sum(${orders.total}),0)`,
        avgOrderValue: sql<string>`coalesce(avg(${orders.total}),0)`,
      }).from(orders), [{ totalOrders: 0, totalRevenue: "0", avgOrderValue: "0" }]),

      run(() => db.select({ count: sql<number>`count(*)` }).from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(eq(roles.name, "customer")), [{ count: 0 }]),

      run(() => db.select({ count: sql<number>`count(*)` }).from(menuItems), [{ count: 0 }]),

      run(() => db.select({ totalExpenses: sql<string>`coalesce(sum(${transactions.amount}),0)` })
        .from(transactions).where(eq(transactions.type, "expense")), [{ totalExpenses: "0" }]),

      run(() => db.select({
        date: sql<string>`date(${orders.createdAt})`,
        revenue: sql<string>`coalesce(sum(${orders.total}),0)`,
      }).from(orders)
        .where(sql`${orders.createdAt} >= date_sub(now(), interval ${intervalDays} day)`)
        .groupBy(sql`date(${orders.createdAt})`)
        .orderBy(sql`date(${orders.createdAt})`), []),

      run(() => db.select({
        date: sql<string>`date(${transactions.createdAt})`,
        expenses: sql<string>`coalesce(sum(${transactions.amount}),0)`,
      }).from(transactions)
        .where(sql`${transactions.type} = 'expense' and ${transactions.createdAt} >= date_sub(now(), interval ${intervalDays} day)`)
        .groupBy(sql`date(${transactions.createdAt})`)
        .orderBy(sql`date(${transactions.createdAt})`), []),

      run(() => db.select({
        date: sql<string>`date(${orders.createdAt})`,
        orders: sql<number>`count(*)`,
      }).from(orders)
        .where(sql`${orders.createdAt} >= date_sub(now(), interval ${intervalDays} day)`)
        .groupBy(sql`date(${orders.createdAt})`)
        .orderBy(sql`date(${orders.createdAt})`), []),

      run(() => db.select({
        hour: sql<number>`hour(${orders.createdAt})`,
        orders: sql<number>`count(*)`,
        revenue: sql<string>`coalesce(sum(${orders.total}),0)`,
      }).from(orders)
        .groupBy(sql`hour(${orders.createdAt})`)
        .orderBy(sql`hour(${orders.createdAt})`), []),

      run(() => db.select({
        day: sql<string>`dayname(${orders.createdAt})`,
        orders: sql<number>`count(*)`,
        revenue: sql<string>`coalesce(sum(${orders.total}),0)`,
      }).from(orders)
        .groupBy(sql`dayname(${orders.createdAt})`)
        .orderBy(sql`dayofweek(${orders.createdAt})`), []),

      run(() => db.select({
        title: orderItems.title,
        totalQuantity: sql<number>`sum(${orderItems.quantity})`,
        totalRevenue: sql<string>`coalesce(sum(${orderItems.price} * ${orderItems.quantity}),0)`,
      }).from(orderItems)
        .groupBy(orderItems.title)
        .orderBy(sql`sum(${orderItems.quantity}) desc`)
        .limit(10), []),

      run(() => db.select({
        category: sql<string>`coalesce(${categories.name}, 'Uncategorized')`,
        totalQuantity: sql<number>`coalesce(sum(${orderItems.quantity}),0)`,
        totalRevenue: sql<string>`coalesce(sum(${orderItems.price} * ${orderItems.quantity}),0)`,
      }).from(orderItems)
        .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .leftJoin(categories, eq(menuItems.categoryId, categories.id))
        .groupBy(categories.name)
        .orderBy(sql`coalesce(sum(${orderItems.quantity}),0) desc`), []),

      run(() => db.select({
        month: sql<string>`date_format(${users.createdAt}, '%Y-%m')`,
        newCustomers: sql<number>`count(*)`,
      }).from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(eq(roles.name, "customer"))
        .groupBy(sql`date_format(${users.createdAt}, '%Y-%m')`)
        .orderBy(sql`date_format(${users.createdAt}, '%Y-%m')`), []),

      run(() => db.select({
        status: orders.status,
        count: sql<number>`count(*)`,
        revenue: sql<string>`coalesce(sum(${orders.total}),0)`,
      }).from(orders)
        .groupBy(orders.status), []),
    ]);

    const orderStatsRow = orderStats[0] ?? {};
    const customerStatsRow = customerStats[0] ?? {};
    const menuStatsRow = menuStats[0] ?? {};
    const totalExpenses = Number(totalExpensesResult[0]?.totalExpenses ?? 0);
    const totalRevenue = Number(orderStatsRow.totalRevenue ?? 0);

    const expenseMap = new Map<string, number>();
    for (const row of expensesOverTime) {
      expenseMap.set(row.date, Number(row.expenses));
    }

    const revenueOverTimeMerged = revenueOverTime.map((row) => ({
      date: row.date,
      revenue: Number(row.revenue),
      expenses: expenseMap.get(row.date) ?? 0,
    }));

    const orderDayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const peakDaysSorted = orderDayOrder
      .map((day) => {
        const found = peakDays.find((pd) => pd.day === day);
        return found
          ? { day, orders: Number(found.orders), revenue: Number(found.revenue) }
          : { day, orders: 0, revenue: 0 };
      });

    let cumulative = 0;
    const customerGrowthCumulative = customerGrowth.map((row) => {
      cumulative += Number(row.newCustomers);
      return {
        month: row.month,
        newCustomers: Number(row.newCustomers),
        totalCustomers: cumulative,
      };
    });

    const hourLabels = [
      "12AM", "1AM", "2AM", "3AM", "4AM", "5AM", "6AM", "7AM", "8AM", "9AM", "10AM", "11AM",
      "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM", "7PM", "8PM", "9PM", "10PM", "11PM",
    ];
    const peakHoursAll = Array.from({ length: 24 }, (_, h) => {
      const found = peakHours.find((ph) => ph.hour === h);
      return found
        ? { hour: h, label: hourLabels[h], orders: Number(found.orders), revenue: Number(found.revenue) }
        : { hour: h, label: hourLabels[h], orders: 0, revenue: 0 };
    });

    const statusColors: Record<string, string> = {
      Pending: "#f59e0b",
      Preparing: "#3b82f6",
      "Out For Delivery": "#8b5cf6",
      Delivered: "#22c55e",
      Cancelled: "#ef4444",
    };

    return NextResponse.json({
      totalOrders: Number(orderStatsRow.totalOrders ?? 0),
      totalRevenue,
      avgOrderValue: Number(orderStatsRow.avgOrderValue ?? 0),
      totalCustomers: Number(customerStatsRow.count ?? 0),
      totalMenuItems: Number(menuStatsRow.count ?? 0),
      totalExpenses,
      profit: totalRevenue - totalExpenses,

      revenueOverTime: revenueOverTimeMerged,
      ordersOverTime: ordersOverTime.map((r) => ({
        date: r.date,
        orders: Number(r.orders),
      })),

      peakHours: peakHoursAll,
      peakDays: peakDaysSorted,

      popularItems: popularItems.map((item) => ({
        title: item.title,
        totalQuantity: Number(item.totalQuantity),
        totalRevenue: Number(item.totalRevenue),
      })),

      categorySales: categorySales.map((item) => ({
        category: item.category,
        totalQuantity: Number(item.totalQuantity),
        totalRevenue: Number(item.totalRevenue),
      })),

      customerGrowth: customerGrowthCumulative,

      statusBreakdown: statusBreakdown.map((item) => ({
        status: item.status,
        count: Number(item.count),
        revenue: Number(item.revenue),
        color: statusColors[item.status] ?? "#6b7280",
      })),
    });
  } catch (error) {
    console.error("Failed to load reports:", error);
    return NextResponse.json({ error: "Unable to load reports" }, { status: 500 });
  }
}
