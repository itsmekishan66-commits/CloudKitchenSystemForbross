import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { generateCSV } from "@/lib/exports/csv";
import { generateExcel } from "@/lib/exports/excel";
import { generatePDF } from "@/lib/exports/pdf";
import { db } from "@/db";
import { users, roles, orders, orderItems, menuItems } from "@/db/schemas";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { getUsers, getInventoryItems } from "@/db/services";

async function fetchData(source: string): Promise<NextResponse | Record<string, unknown>[]> {
    switch (source) {
        case "users": {
            const perm = await apiRequirePermissions(PERMISSIONS.DOWNLOAD_USERS);
            if (perm instanceof NextResponse) return perm;
            return getUsers() as unknown as Record<string, unknown>[];
        }
        case "guest-users": {
            const perm = await apiRequirePermissions(PERMISSIONS.DOWNLOAD_GUEST_USERS);
            if (perm instanceof NextResponse) return perm;
            return db
                .select({
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    phone: users.phone,
                    address: users.address,
                    createdAt: users.createdAt,
                })
                .from(users)
                .where(eq(users.isGuest, true))
                .orderBy(users.name) as unknown as Record<string, unknown>[];
        }
        case "inventory": {
            const perm = await apiRequirePermissions(PERMISSIONS.DOWNLOAD_INVENTORY);
            if (perm instanceof NextResponse) return perm;
            return getInventoryItems() as unknown as Record<string, unknown>[];
        }
        case "reports": {
            const perm = await apiRequirePermissions(PERMISSIONS.DOWNLOAD_REPORTS);
            if (perm instanceof NextResponse) return perm;

            const [orderStats] = await db
                .select({
                    totalOrders: sql<number>`count(*)`,
                    totalRevenue: sql<string>`coalesce(sum(${orders.total}),0)`,
                    avgOrderValue: sql<string>`coalesce(avg(${orders.total}),0)`,
                })
                .from(orders);

            const [customerStats] = await db
                .select({ count: sql<number>`count(*)` })
                .from(users)
                .leftJoin(roles, eq(users.roleId, roles.id))
                .where(eq(roles.name, "customer"));

            const [menuStats] = await db
                .select({ count: sql<number>`count(*)` })
                .from(menuItems);

            const statusBreakdown = await db
                .select({
                    status: orders.status,
                    count: sql<number>`count(*)`,
                    revenue: sql<string>`coalesce(sum(${orders.total}),0)`,
                })
                .from(orders)
                .groupBy(orders.status);

            const popularItems = await db
                .select({
                    title: orderItems.title,
                    totalQuantity: sql<number>`sum(${orderItems.quantity})`,
                    totalRevenue: sql<string>`coalesce(sum(${orderItems.price} * ${orderItems.quantity}),0)`,
                })
                .from(orderItems)
                .groupBy(orderItems.title)
                .orderBy(sql`sum(${orderItems.quantity}) desc`)
                .limit(10);

            return [{
                totalOrders: Number(orderStats?.totalOrders ?? 0),
                totalRevenue: Number(orderStats?.totalRevenue ?? 0),
                avgOrderValue: Number(orderStats?.avgOrderValue ?? 0),
                totalCustomers: Number(customerStats?.count ?? 0),
                totalMenuItems: Number(menuStats?.count ?? 0),
                statusBreakdown: JSON.stringify(statusBreakdown.map((s) => ({ status: s.status, count: Number(s.count), revenue: Number(s.revenue) }))),
                popularItems: JSON.stringify(popularItems.map((i) => ({ title: i.title, totalQuantity: Number(i.totalQuantity), totalRevenue: Number(i.totalRevenue) }))),
            }];
        }
        default: {
            return NextResponse.json({ error: "Invalid export source" }, { status: 400 });
        }
    }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
    const { type } = await params;
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") || "users";

    const data = await fetchData(source);
    if (data instanceof NextResponse) return data;

    const filename = source;

    switch (type) {
        case "csv": {
            const csv = generateCSV(data);
            return new Response(csv, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename="${filename}.csv"`,
                },
            });
        }

        case "excel": {
            const buffer = await generateExcel(data, source);
            return new Response(buffer as ArrayBuffer, {
                headers: {
                    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
                },
            });
        }
        case "pdf": {
            const pdf = await generatePDF(data);
            return new Response(new Uint8Array(pdf), {
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="${filename}.pdf"`,
                },
            });
        }
        default: {
            return NextResponse.json({ "error": "Invalid export type" });
        }
    }
}