import { NextResponse } from "next/server";
import { unstable_cache, revalidateTag } from "next/cache";
import { createOrder, getOrdersWithDetails, updateOrderStatus, getOrderById } from "@/db/services/orders";
import { getActivePromotionByCode, incrementPromotionUsage } from "@/db/services/promotions";
import { createUser } from "@/db/services/users";
import { db } from "@/db";
import { eq, inArray } from "drizzle-orm";
import { users, menuItems } from "@/db/schemas";
import type { NewOrder } from "@/db/schemas";
import { getCurrentUser } from "@/lib/auth";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/cache-tags";
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

    const getCachedOrders = unstable_cache(
      () => getOrdersWithDetails(),
      [CACHE_TAGS.ORDERS],
      { revalidate: 30, tags: [CACHE_TAGS.ORDERS] }
    );

    const orders = await getCachedOrders();
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

  if (items.length === 0) {
    return NextResponse.json(
      { error: "A non-empty cart is required" },
      { status: 400 },
    );
  }

  // Recompute the subtotal from authoritative DB prices to prevent price tampering.
  const menuItemIds = items
    .map((i) => Number(i.id))
    .filter((id) => Number.isInteger(id));
  const priceRows =
    menuItemIds.length > 0
      ? await db
          .select({ id: menuItems.id, price: menuItems.price })
          .from(menuItems)
          .where(inArray(menuItems.id, menuItemIds))
      : [];
  const priceMap = new Map(priceRows.map((r) => [r.id, Number(r.price)]));

  const itemsSubtotal = items.reduce((sum, item) => {
    const id = Number(item.id);
    const basePrice =
      Number.isInteger(id) && priceMap.has(id)
        ? (priceMap.get(id) as number)
        : Number(item.price);
    const addonTotal = (item.addons ?? []).reduce((s, a) => s + Number(a.price), 0);
    const dp = item.discountPercent ? Number(item.discountPercent) : 0;
    const effectivePrice = dp > 0 ? (basePrice + addonTotal) * (1 - dp / 100) : basePrice + addonTotal;
    return sum + effectivePrice * item.quantity;
  }, 0);

  // Delivery charge is validated server-side from the selected zone.
  const zoneId = Number.isInteger(payload.zoneId) ? payload.zoneId : null;
  const deliveryCharge = Number(payload.deliveryCharge) || 0;

  if (!zoneId) {
    return NextResponse.json(
      { error: "Please select a delivery landmark" },
      { status: 400 },
    );
  }

  const { getZoneById } = await import("@/db/services/delivery-zones");
  const zone = await getZoneById(zoneId);
  if (!zone || !zone.isActive) {
    return NextResponse.json(
      { error: "Selected delivery area is not available" },
      { status: 400 },
    );
  }

  const expectedCharge = Number(zone.deliveryCharge);
  const effectiveCharge =
    zone.minOrderAmount && itemsSubtotal >= Number(zone.minOrderAmount)
      ? 0
      : expectedCharge;

  if (Math.abs(deliveryCharge - effectiveCharge) > 0.01) {
    return NextResponse.json(
      { error: "Delivery charge mismatch" },
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
      const isValid =
        (!startsAt || startsAt <= now) &&
        (!endsAt || endsAt >= now) &&
        (usageLimit === 0 || usageCount < usageLimit);

      if (!isValid) {
        return NextResponse.json({ error: "Coupon is no longer valid" }, { status: 400 });
      }

      if (promotion.discountType === "percentage") {
        appliedCouponDiscount = Math.min(
          itemsSubtotal,
          itemsSubtotal * (Number(promotion.discountValue) / 100),
        );
      } else {
        appliedCouponDiscount = Math.min(itemsSubtotal, Number(promotion.discountValue) || 0);
      }

      appliedCoupon = { id: promotion.id, code: promotion.code ?? couponCode };
    }

    const total = Math.max(0, itemsSubtotal - appliedCouponDiscount + effectiveCharge);

    const orderId = await createOrder({
      userId,
      customerName,
      phone,
      address,
      paymentMethod,
      deliveryCharge: effectiveCharge.toFixed(2),
      total: total.toFixed(2),
      landmarkName: zone?.landmarkName || "",
      discountAmount: appliedCouponDiscount > 0 ? appliedCouponDiscount.toFixed(2) : "0.00",
      items: items.map((item) => {
        const id = Number(item.id);
        const basePrice =
          Number.isInteger(id) && priceMap.has(id)
            ? (priceMap.get(id) as number)
            : Number(item.price);
        const addonTotal = (item.addons ?? []).reduce((s, a) => s + Number(a.price), 0);
        const dp = item.discountPercent ? Number(item.discountPercent) : 0;
        const withAddons = basePrice + addonTotal;
        const finalPrice = dp > 0 ? withAddons - (withAddons * dp) / 100 : withAddons;
        const meta: Record<string, unknown> = {
          image: item.image,
          clientId: item.id,
        };
        if (item.addons && item.addons.length > 0) meta.addons = item.addons;
        if (dp > 0) {
          meta.originalPrice = withAddons;
          meta.discountPercent = dp;
        }
        return {
          menuItemId: Number.isInteger(id) ? id : null,
          title: item.title,
          quantity: item.quantity,
          price: finalPrice.toFixed(2),
          meta,
        };
      }),
    });

    if (userId) {
      const [creditUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (creditUser && Number(creditUser.creditBalance || 0) > 0) {
        const credit = Number(creditUser.creditBalance);
        const appliedCredit = Math.min(credit, total);
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

    const warnings = await updateOrderStatus(id, status);
    revalidateTag(CACHE_TAGS.ORDERS, "max");
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, "max");
    revalidateTag(CACHE_TAGS.REPORTS, "max");
    revalidateTag(CACHE_TAGS.USER_STATS, "max");

    if (status === "Delivered") {
      revalidateTag(CACHE_TAGS.ACCOUNTING_OVERVIEW, "max");
      revalidateTag(CACHE_TAGS.TRIAL_BALANCE, "max");
      revalidateTag(CACHE_TAGS.INCOME_STATEMENT, "max");
      revalidateTag(CACHE_TAGS.BALANCE_SHEET, "max");
      revalidateTag(CACHE_TAGS.CASH_FLOW, "max");
    }

    return NextResponse.json({ ok: true, warnings });
  } catch (error) {
    console.error("Failed to update order status", error);
    return NextResponse.json(
      { error: "Unable to update order status" },
      { status: 500 },
    );
  }
}
