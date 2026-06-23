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

    const orderId = await createOrder({
      userId,
      customerName,
      phone,
      address,
      paymentMethod,
      total: total.toFixed(2),
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
