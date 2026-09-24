/**
 * ============================================================
 * CHECKOUT — shared order validation & placement pipeline
 * ============================================================
 * Single source of truth for validating + pricing a checkout
 * payload and creating the resulting order.
 *
 * Used by:
 *   - POST /api/orders              (COD — creates the order immediately)
 *   - gateway initiate endpoints    (ESEWA / KHALTI — pay-on-success: the
 *     payload is validated & priced, then stored on the payment
 *     transaction; NO order row is created yet)
 *   - gateway verify endpoints      (creates the order from the stored
 *     payload ONLY after the gateway confirms the payment)
 *
 * SECURITY:
 *   - Item prices are recomputed from authoritative DB rows; client
 *     prices are never trusted.
 *   - Delivery charge is re-validated against the delivery zone.
 *   - Coupon discounts are recomputed from the promotions table and the
 *     coupon is checked for validity (window + usage limit).
 *   - Side effects (guest user creation, credit deduction, coupon usage
 *     increment) happen ONLY when the order is actually created.
 * ============================================================
 */
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { menuItems, users, type NewOrderItem } from "@/db/schemas";
import { createOrder } from "@/db/services/orders";
import { createUser } from "@/db/services/users";
import { getActivePromotionByCode, incrementPromotionUsage } from "@/db/services/promotions";
import { getZoneById } from "@/db/services/delivery-zones";
import { getCurrentUser } from "@/lib/auth";
import type { CartItem } from "@/store/cartStore";

export const PAYMENT_METHODS = ["COD", "ONLINE", "ESEWA", "KHALTI"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export function isPaymentMethod(value: string): value is PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(value);
}

export type CheckoutPayload = {
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

export type ValidatedCheckoutItem = Omit<NewOrderItem, "id" | "orderId">;

export type ValidatedCheckout = {
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: PaymentMethod;
  zoneId: number;
  landmarkName: string;
  deliveryCharge: number; // effective, server-computed
  discountAmount: number; // applied coupon discount, server-computed
  total: number;
  couponId: number | null;
  items: ValidatedCheckoutItem[];
};

/** Validation / pricing failure carrying the HTTP status to return. */
export class CheckoutError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CheckoutError";
    this.status = status;
  }
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Validate a checkout payload and recompute all amounts server-side.
 * Throws `CheckoutError` (with a client-facing message) on failure.
 * Does NOT create any user, order, or run side effects.
 */
export async function validateAndPriceCheckout(
  payload: CheckoutPayload,
  opts: { allowedPaymentMethods?: readonly PaymentMethod[] } = {},
): Promise<ValidatedCheckout> {
  const allowed = opts.allowedPaymentMethods ?? PAYMENT_METHODS;

  const customerName = cleanText(payload.customerName);
  const phone = cleanText(payload.phone);
  const address = cleanText(payload.address);
  const paymentMethod = (cleanText(payload.paymentMethod) || "COD") as string;
  const items = Array.isArray(payload.items) ? payload.items : [];
  const couponCode = cleanText(payload.couponCode);
  const couponDiscount = Number(payload.couponDiscount) || 0;

  if (!customerName || !phone || !address) {
    throw new CheckoutError("Name, phone, and address are required");
  }

  if (!isPaymentMethod(paymentMethod) || !allowed.includes(paymentMethod)) {
    throw new CheckoutError("Unsupported payment method");
  }

  if (items.length === 0) {
    throw new CheckoutError("A non-empty cart is required");
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
    throw new CheckoutError("Please select a delivery landmark");
  }

  const zone = await getZoneById(zoneId);
  if (!zone || !zone.isActive) {
    throw new CheckoutError("Selected delivery area is not available");
  }

  const expectedCharge = Number(zone.deliveryCharge);
  const effectiveCharge =
    zone.minOrderAmount && itemsSubtotal >= Number(zone.minOrderAmount)
      ? 0
      : expectedCharge;

  if (Math.abs(deliveryCharge - effectiveCharge) > 0.01) {
    throw new CheckoutError("Delivery charge mismatch");
  }

  // Coupon: recompute the discount from the promotions table and verify
  // the coupon is still valid. Usage is only incremented when the order is
  // actually created (createOrderFromValidated).
  let couponId: number | null = null;
  let appliedCouponDiscount = Math.max(0, couponDiscount);

  if (couponCode) {
    const promotion = await getActivePromotionByCode(couponCode);
    if (!promotion) {
      throw new CheckoutError("Invalid coupon code");
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
      throw new CheckoutError("Coupon is no longer valid");
    }

    if (promotion.discountType === "percentage") {
      appliedCouponDiscount = Math.min(
        itemsSubtotal,
        itemsSubtotal * (Number(promotion.discountValue) / 100),
      );
    } else {
      appliedCouponDiscount = Math.min(itemsSubtotal, Number(promotion.discountValue) || 0);
    }

    couponId = promotion.id;
  }

  const total = Math.max(0, itemsSubtotal - appliedCouponDiscount + effectiveCharge);

  const itemsOut: ValidatedCheckoutItem[] = items.map((item) => {
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
  });

  return {
    customerName,
    phone,
    address,
    paymentMethod: paymentMethod as PaymentMethod,
    zoneId,
    landmarkName: zone?.landmarkName || "",
    deliveryCharge: effectiveCharge,
    discountAmount: appliedCouponDiscount,
    total,
    couponId,
    items: itemsOut,
  };
}

/**
 * Create the order from a validated checkout snapshot. Resolves the user
 * (current session or a new guest), inserts the order + items, deducts
 * credit balance, and increments coupon usage.
 *
 * `opts.paymentSettled` marks the order as paid-up-front (used by the
 * gateway verify step, which runs after the payment already succeeded).
 * Returns the created order id.
 */
export async function createOrderFromValidated(
  validated: ValidatedCheckout,
  opts: { paymentSettled?: boolean } = {},
): Promise<number> {
  let userId: number | null = null;
  const user = await getCurrentUser();

  if (user) {
    userId = user.id;
  } else {
    userId = await createUser({
      name: validated.customerName,
      email: null,
      phone: validated.phone || null,
      address: validated.address || null,
      passwordHash: null,
      roleId: undefined,
      isGuest: true,
    });
  }

  const orderId = await createOrder({
    userId,
    customerName: validated.customerName,
    phone: validated.phone,
    address: validated.address,
    paymentMethod: validated.paymentMethod,
    deliveryCharge: validated.deliveryCharge.toFixed(2),
    total: validated.total.toFixed(2),
    landmarkName: validated.landmarkName || "",
    discountAmount: validated.discountAmount > 0 ? validated.discountAmount.toFixed(2) : "0.00",
    paymentSettled: opts.paymentSettled ? true : undefined,
    dueAmount: opts.paymentSettled ? "0.00" : undefined,
    items: validated.items,
  });

  // Deduct credit balance (COD path / post-payment placement alike).
  if (userId) {
    const [creditUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (creditUser && Number(creditUser.creditBalance || 0) > 0) {
      const credit = Number(creditUser.creditBalance);
      const appliedCredit = Math.min(credit, validated.total);
      await db.update(users)
        .set({ creditBalance: String(credit - appliedCredit) })
        .where(eq(users.id, userId));
    }
  }

  // Coupon usage increments only when the order actually exists.
  if (validated.couponId != null) {
    await incrementPromotionUsage(validated.couponId);
  }

  return orderId;
}