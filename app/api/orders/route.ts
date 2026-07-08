import { NextResponse } from "next/server";
import { createOrder, getOrdersWithDetails, updateOrderStatus, getOrderById } from "@/db/services/orders";
import { getActivePromotionByCode, incrementPromotionUsage } from "@/db/services/promotions";
import { createUser } from "@/db/services/users";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schemas";
import type { DeliveryZone, NewOrder } from "@/db/schemas";
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
  couponCode?: string;
  couponDiscount?: number;
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
  const couponCode = cleanText(payload.couponCode);
  const couponDiscount = Number(payload.couponDiscount) || 0;

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

  // const deliverySavings = 0;
  let zone: DeliveryZone | null = null;
  if (zoneId) {
    const { getZoneById } = await import("@/db/services/delivery-zones");
    zone = await getZoneById(zoneId);
    if (!zone || !zone.isActive) {
      return NextResponse.json(
        { error: "Selected delivery area is not available" },
        { status: 400 }
      );
    }
    const expectedCharge = Number(zone.deliveryCharge);
    // deliverySavings = Math.max(0, expectedCharge - deliveryCharge);
    Math.max(0, expectedCharge - deliveryCharge);
    // Calculate items subtotal (excl delivery) for min order check
    const itemsSubtotal = items.reduce((s, item) => s + item.price * item.quantity, 0);
    const effectiveCharge =
      zone.minOrderAmount && itemsSubtotal >= Number(zone.minOrderAmount) ? 0 : expectedCharge;

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

    // const itemSavings = items.reduce((sum, item) => {
    items.reduce((sum, item) => {
      if (!item.originalPrice) return sum;
      const addonTotal = (item.addons || []).reduce((s, a) => s + a.price, 0);
      const discountedItemPrice = item.price - addonTotal;
      return sum + Math.max(0, item.originalPrice - discountedItemPrice) * item.quantity;
    }, 0);

    let appliedCoupon = null as { id: number; code: string } | null;
    let appliedCouponDiscount = Math.max(0, couponDiscount);

    if (couponCode) {
      const promotion = await getActivePromotionByCode(couponCode);
      if (!promotion) {
        return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
      }

      const now = new Date();
      const startsAt = promotion.startsAt ? new Date(promotion.startsAt) : null;
      const endsAt = promotion.endsAt ? new Date(promotion.endsAt) : null;
      const usageLimit = Number(promotion.usageLimit ?? 0) || 0;
      const usageCount = Number(promotion.usageCount ?? 0) || 0;
      const isValid = (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now) && (usageLimit === 0 || usageCount < usageLimit);

      if (!isValid) {
        return NextResponse.json({ error: "Coupon is no longer valid" }, { status: 400 });
      }

      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      if (promotion.discountType === "percentage") {
        appliedCouponDiscount = Math.min(subtotal, subtotal * (Number(promotion.discountValue) / 100));
      } else {
        appliedCouponDiscount = Math.min(subtotal, Number(promotion.discountValue) || 0);
      }

      appliedCoupon = { id: promotion.id, code: promotion.code ?? couponCode };
    }

    const orderId = await createOrder({
      userId,
      customerName,
      phone,
      address,
      paymentMethod,
      deliveryCharge: deliveryCharge.toFixed(2),
      total: total.toFixed(2),
      landmarkName: zone?.landmarkName || "",
      discountAmount: appliedCouponDiscount > 0 ? appliedCouponDiscount.toFixed(2) : "0.00",
      items: items.map((item) => {
        const meta: Record<string, unknown> = {
          image: item.image,
          clientId: item.id,
        };
        if (item.addons && item.addons.length > 0) meta.addons = item.addons;
        if (item.originalPrice) meta.originalPrice = item.originalPrice;
        if (item.discountPercent) meta.discountPercent = item.discountPercent;
        return {
          menuItemId: Number.isInteger(Number(item.id)) ? Number(item.id) : null,
          title: item.title,
          quantity: item.quantity,
          price: item.price.toFixed(2),
          meta,
        };
      }),
    });

    if (userId) {
      const [creditUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (creditUser && Number(creditUser.creditBalance || 0) > 0) {
        const credit = Number(creditUser.creditBalance);
        const orderTotal = Number(total);
        const appliedCredit = Math.min(credit, orderTotal);
        await db.update(users)
          .set({ creditBalance: String(credit - appliedCredit) })
          .where(eq(users.id, userId));
      }
    }

    if (appliedCoupon) {
      await incrementPromotionUsage(appliedCoupon.id);
    }

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

    const existing = await getOrderById(id);
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (existing.status === "Delivered" || existing.status === "Cancelled") {
      return NextResponse.json(
        { error: `Cannot change status of a ${existing.status.toLowerCase()} order` },
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
