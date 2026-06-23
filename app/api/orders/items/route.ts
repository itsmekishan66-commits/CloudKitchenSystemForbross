import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { getAvailableMenuItems } from "@/db/services/menu-items";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { orders, orderItems } from "@/db/schemas";

export async function PATCH(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_ORDERS);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const itemId = Number(body.itemId);
    const action = body.action as string;
    const quantity = body.quantity !== undefined ? Number(body.quantity) : undefined;

    if (!Number.isInteger(itemId)) {
      return NextResponse.json({ error: "Valid itemId is required" }, { status: 400 });
    }

    const [item] = await db.select().from(orderItems).where(eq(orderItems.id, itemId)).limit(1);
    if (!item) {
      return NextResponse.json({ error: "Order item not found" }, { status: 404 });
    }

    let newQty = item.quantity;

    if (action === "increase") {
      newQty = item.quantity + 1;
    } else if (action === "decrease") {
      newQty = item.quantity - 1;
      if (newQty < 1) {
        return NextResponse.json({ error: "Quantity cannot be less than 1. Use delete to remove." }, { status: 400 });
      }
    } else if (quantity !== undefined && quantity >= 1) {
      newQty = quantity;
    } else {
      return NextResponse.json({ error: "Provide action (increase/decrease) or a valid quantity" }, { status: 400 });
    }

    await db.update(orderItems).set({ quantity: newQty }).where(eq(orderItems.id, itemId));

    const allItems = await db.select().from(orderItems).where(eq(orderItems.orderId, item.orderId));
    const newTotal = allItems.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0).toFixed(2);
    await db.update(orders).set({ total: newTotal }).where(eq(orders.id, item.orderId));

    return NextResponse.json({ ok: true, quantity: newQty, total: newTotal });
  } catch (error) {
    console.error("Failed to update item", error);
    return NextResponse.json({ error: "Unable to update item" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_ORDERS);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const itemId = Number(searchParams.get("itemId"));

    if (!Number.isInteger(itemId)) {
      return NextResponse.json({ error: "Valid itemId is required" }, { status: 400 });
    }

    const [item] = await db.select().from(orderItems).where(eq(orderItems.id, itemId)).limit(1);
    if (!item) {
      return NextResponse.json({ error: "Order item not found" }, { status: 404 });
    }

    await db.delete(orderItems).where(eq(orderItems.id, itemId));

    const remaining = await db.select().from(orderItems).where(eq(orderItems.orderId, item.orderId));

    if (remaining.length === 0) {
      await db.update(orders).set({ total: "0.00", status: "Cancelled" }).where(eq(orders.id, item.orderId));
      return NextResponse.json({ ok: true, total: "0.00", empty: true });
    }

    const newTotal = remaining.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0).toFixed(2);
    await db.update(orders).set({ total: newTotal }).where(eq(orders.id, item.orderId));

    return NextResponse.json({ ok: true, total: newTotal, empty: false });
  } catch (error) {
    console.error("Failed to delete item", error);
    return NextResponse.json({ error: "Unable to delete item" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_ORDERS);
    if (user instanceof NextResponse) return user;

    const menuItems = await getAvailableMenuItems();
    return NextResponse.json({ menuItems });
  } catch (error) {
    console.error("Failed to load menu items", error);
    return NextResponse.json({ error: "Unable to load menu items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_ORDERS);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const orderId = Number(body.orderId);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const price = Number(body.price);
    const quantity = Number(body.quantity) || 1;

    if (!Number.isInteger(orderId)) {
      return NextResponse.json({ error: "Valid orderId is required" }, { status: 400 });
    }
    if (!title || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Valid title and price are required" }, { status: 400 });
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await db.insert(orderItems).values({
      orderId,
      menuItemId: body.menuItemId || null,
      title,
      quantity,
      price: price.toFixed(2),
      meta: body.meta || null,
    });

    const allItems = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const newTotal = allItems.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0).toFixed(2);
    await db.update(orders).set({ total: newTotal }).where(eq(orders.id, orderId));

    return NextResponse.json({ ok: true, total: newTotal }, { status: 201 });
  } catch (error) {
    console.error("Failed to add item", error);
    return NextResponse.json({ error: "Unable to add item" }, { status: 500 });
  }
}
