import { NextResponse } from "next/server";

import {
  createOrder,
  getOrdersWithDetails,
  updateOrderStatus,
} from "@/db/services/orders";
import { createUser } from "@/db/services/users";
import type { NewOrder } from "@/db/schemas";
import { getCurrentUser } from "@/lib/auth";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import type { CartItem } from "@/store/cartStore";

export const dynamic = "force-dynamic";

const allowedPaymentMethods = ["COD", "ONLINE"] as const;

type PaymentMethod = (typeof allowedPaymentMethods)[number];

type OrderPayload = {
  customerName?: string;
  phone?: string;
  address?: string;
  paymentMethod?: string;
  total?: number;
  items?: CartItem[];
  zoneId?: number;
  deliveryCharge?: number;
};



type UpdateOrderPayload = {
  id?: number;
  status?: NewOrder["status"];
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isPaymentMethod(value: string): value is PaymentMethod {
  return allowedPaymentMethods.includes(value as PaymentMethod);
}

export async function GET() {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.VIEW_ORDERS
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const orders = await getOrdersWithDetails();
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Failed to load orders", error);
    return NextResponse.json(
      { error: "Unable to load orders" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let payload: OrderPayload;

  try {
    payload = (await request.json()) as OrderPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const customerName = cleanText(payload.customerName);
  const phone = cleanText(payload.phone);
  const address = cleanText(payload.address);
  const paymentMethod = cleanText(payload.paymentMethod) || "COD";
  const total = Number(payload.total);
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!customerName || !phone || !address) {
    return NextResponse.json(
      { error: "Name, phone, and address are required" },
      { status: 400 },
    );
  }

  if (!isPaymentMethod(paymentMethod)) {
    return NextResponse.json(
      { error: "Unsupported payment method" },
      { status: 400 },
    );
  }

  if (!Number.isFinite(total) || total <= 0 || items.length === 0) {
    return NextResponse.json(
      { error: "A non-empty cart and valid total are required" },
      { status: 400 },
    );
  }

  //yo delivery charge validation ko lagi
  const zoneId = Number.isInteger(payload.zoneId) ? payload.zoneId : null;
  const deliveryCharge = Number(payload.deliveryCharge) || 0;
  // If zoneId provided, validate it and calculate charge server-side

  if (!zoneId) {
    return NextResponse.json(
      { error: "Please select a delivery landmark" },
      { status: 400 },
    );
  }

  let deliverySavings = 0;
  if (zoneId) {
    const { getZoneById } = await import("@/db/services/delivery-zones");
    const zone = await getZoneById(zoneId);
    if (!zone || !zone.isActive) {
      return NextResponse.json(
        { error: "Selected delivery area is not available" },
        { status: 400 }
      );
    }
    const expectedCharge = Number(zone.deliveryCharge);
    deliverySavings = Math.max(0, expectedCharge - deliveryCharge);
    // Apply free delivery if min order met
    const effectiveCharge =
      zone.minOrderAmount && total >= Number(zone.minOrderAmount) ? 0 : expectedCharge;

    if (Math.abs(deliveryCharge - effectiveCharge) > 0.01) {
      return NextResponse.json(
        { error: "Delivery charge mismatch" },
        { status: 400 }
      );
    }
  }

  try {
    let userId: number | null = null;
    const user = await getCurrentUser();

    if (user) {
      userId = user.id;
    } else {
      const guestId = await createUser({
        name: customerName,
        email: null,
        phone: phone || null,
        address: address || null,
        passwordHash: null,
        roleId: undefined,
        isGuest: true,
      });
      userId = guestId;
    }

    const itemSavings = items.reduce((sum, item) => {
      if (!item.originalPrice) return sum;
      const addonTotal = (item.addons || []).reduce((s, a) => s + a.price, 0);
      const discountedItemPrice = item.price - addonTotal;
      return sum + Math.max(0, item.originalPrice - discountedItemPrice) * item.quantity;
    }, 0);

    const orderId = await createOrder({
      userId,
      customerName,
      phone,
      address,
      paymentMethod,
      deliveryCharge: deliveryCharge.toFixed(2),
      total: total.toFixed(2),
      discountAmount: (itemSavings + deliverySavings).toFixed(2),
      items: items.map((item) => ({
        menuItemId: null,
        title: item.title,
        quantity: item.quantity,
        price: item.price.toFixed(2),
        meta: {
          image: item.image,
          clientId: item.id,
        },
      })),
    });

    return NextResponse.json({ orderId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create order", error);
    return NextResponse.json(
      { error: "Unable to place order" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.UPDATE_ORDERS
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const payload = (await request.json()) as UpdateOrderPayload;
    const id = Number(payload.id);
    const status = payload.status;
    const statuses = [
      "Pending",
      "Preparing",
      "Out For Delivery",
      "Delivered",
      "Cancelled",
    ];

    if (!Number.isInteger(id) || !status || !statuses.includes(status)) {
      return NextResponse.json(
        { error: "A valid order id and status are required" },
        { status: 400 },
      );
    }

    await updateOrderStatus(id, status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update order status", error);
    return NextResponse.json(
      { error: "Unable to update order status" },
      { status: 500 },
    );
  }
}
