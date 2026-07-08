import { NextResponse } from "next/server";
import { createOrder } from "@/db/services/orders";
import { createUser } from "@/db/services/users";
import { getZoneById } from "@/db/services/delivery-zones";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schemas";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const allowedPaymentMethods = ["COD", "ONLINE"] as const;
const allowedStatuses = ["Pending", "Preparing", "Out For Delivery", "Delivered", "Cancelled"] as const;

type PaymentMethod = (typeof allowedPaymentMethods)[number];
type OrderStatus = (typeof allowedStatuses)[number];

type OrderItemInput = {
  title?: string;
  quantity?: number;
  price?: number;
  menuItemId?: number | null;
  meta?: Record<string, unknown> | null;
};

type CreateOrderPayload = {
  customerName?: string;
  phone?: string;
  address?: string;
  paymentMethod?: string;
  status?: string;
  userId?: number;
  isGuest?: boolean;
  zoneId?: number;
  landmarkName?: string;
  deliveryCharge?: number;
  discountAmount?: number;
  dueAmount?: number;
  notes?: string;
  items?: OrderItemInput[];
};

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isPaymentMethod(value: string): value is PaymentMethod {
  return allowedPaymentMethods.includes(value as PaymentMethod);
}

function isOrderStatus(value: string): value is OrderStatus {
  return allowedStatuses.includes(value as OrderStatus);
}

export async function POST(request: Request) {
  const user = await apiRequirePermissions(PERMISSIONS.CREATE_ORDERS);
  if (user instanceof NextResponse) return user;

  let payload: CreateOrderPayload;
  try {
    payload = (await request.json()) as CreateOrderPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const customerName = cleanText(payload.customerName);
  const phone = cleanText(payload.phone);
  const address = cleanText(payload.address);
  const paymentMethod = cleanText(payload.paymentMethod) || "COD";
  const status = cleanText(payload.status) || "Pending";
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!customerName || !phone || !address) {
    return NextResponse.json(
      { error: "Name, phone, and address are required" },
      { status: 400 },
    );
  }

  if (!isPaymentMethod(paymentMethod)) {
    return NextResponse.json({ error: "Unsupported payment method" }, { status: 400 });
  }

  if (!isOrderStatus(status)) {
    return NextResponse.json({ error: "Unsupported status" }, { status: 400 });
  }

  const normalizedItems = items
    .map((item) => ({
      title: cleanText(item.title),
      quantity: Number(item.quantity),
      price: Number(item.price),
      menuItemId: Number.isInteger(Number(item.menuItemId)) ? Number(item.menuItemId) : null,
      meta: item.meta ?? null,
    }))
    .filter((item) => item.title && item.quantity > 0 && Number.isFinite(item.price) && item.price >= 0);

  if (normalizedItems.length === 0) {
    return NextResponse.json({ error: "At least one valid order item is required" }, { status: 400 });
  }

  const deliveryCharge = Math.max(0, Number(payload.deliveryCharge) || 0);
  const discountAmount = Math.max(0, Number(payload.discountAmount) || 0);
  const dueAmount = Math.max(0, Number(payload.dueAmount) || 0);

  const itemsSubtotal = normalizedItems.reduce((s, item) => s + item.price * item.quantity, 0);
  const total = itemsSubtotal + deliveryCharge - discountAmount + dueAmount;

  const zoneId = Number.isInteger(payload.zoneId) ? payload.zoneId : null;
  let landmarkName = cleanText(payload.landmarkName);

  if (zoneId) {
    const zone = await getZoneById(zoneId);
    if (!zone || !zone.isActive) {
      return NextResponse.json({ error: "Selected delivery area is not available" }, { status: 400 });
    }
    landmarkName = zone.landmarkName || landmarkName;
  }

  try {
    let userId: number | null = null;

    if (payload.isGuest) {
      userId = await createUser({
        name: customerName,
        email: null,
        phone: phone || null,
        address: address || null,
        passwordHash: null,
        roleId: undefined,
        isGuest: true,
      });
    } else if (payload.userId) {
      userId = payload.userId;
    } else {
      const dbUser = await getCurrentUser();
      if (dbUser) {
        userId = dbUser.id;
      } else {
        userId = await createUser({
          name: customerName,
          email: null,
          phone: phone || null,
          address: address || null,
          passwordHash: null,
          roleId: undefined,
          isGuest: true,
        });
      }
    }

    const orderId = await createOrder({
      userId,
      customerName,
      phone,
      address,
      paymentMethod,
      status,
      deliveryCharge: deliveryCharge.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      dueAmount: dueAmount.toFixed(2),
      total: total.toFixed(2),
      landmarkName,
      notes: payload.notes ? cleanText(payload.notes) : null,
      items: normalizedItems.map((item) => ({
        menuItemId: item.menuItemId,
        title: item.title,
        quantity: item.quantity,
        price: item.price.toFixed(2),
        meta: item.meta,
      })),
    });

    if (userId) {
      const [creditUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (creditUser && Number(creditUser.creditBalance || 0) > 0) {
        const credit = Number(creditUser.creditBalance);
        const appliedCredit = Math.min(credit, total);
        await db
          .update(users)
          .set({ creditBalance: String(credit - appliedCredit) })
          .where(eq(users.id, userId));
      }
    }

    return NextResponse.json({ orderId, total: total.toFixed(2) }, { status: 201 });
  } catch (error) {
    console.error("Failed to create order", error);
    return NextResponse.json({ error: "Unable to create order" }, { status: 500 });
  }
}

async function getCurrentUser() {
  const { getCurrentUser } = await import("@/lib/auth");
  return getCurrentUser();
}
