import { NextResponse } from "next/server";

import { getOrdersWithDetails } from "@/db/services/orders";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_ORDERS);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const orders = await getOrdersWithDetails();
    const order = orders.find((o: { id: number }) => o.id === orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Failed to load order", error);
    return NextResponse.json({ error: "Unable to load order" }, { status: 500 });
  }
}
