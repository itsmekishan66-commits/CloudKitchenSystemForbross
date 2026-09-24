import { NextResponse } from "next/server";
import { unstable_cache, revalidateTag } from "next/cache";
import { getOrdersWithDetails, updateOrderStatus, getOrderById } from "@/db/services/orders";
import {
  validateAndPriceCheckout,
  createOrderFromValidated,
  CheckoutError,
  PAYMENT_METHODS,
  type CheckoutPayload,
} from "@/db/services/checkout";
import type { NewOrder } from "@/db/schemas";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/cache-tags";

export const dynamic = "force-dynamic";

type UpdateOrderPayload = {
  id?: number;
  status?: NewOrder["status"];
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
  let payload: CheckoutPayload;

  try {
    payload = (await request.json()) as CheckoutPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const paymentMethod = cleanText(payload.paymentMethod) || "COD";

  // eSewa / Khalti orders must NOT be created before the payment succeeds.
  // Those flows go through the gateway initiate endpoint and only create the
  // order after the payment is verified — reject them here so no path can
  // leave a pre-paid-unverified order lying around.
  if (paymentMethod === "ESEWA" || paymentMethod === "KHALTI") {
    return NextResponse.json(
      { error: "eSewa / Khalti orders are placed only after a successful payment — please complete the payment at checkout first." },
      { status: 400 },
    );
  }

  try {
    const validated = await validateAndPriceCheckout(payload, {
      allowedPaymentMethods: PAYMENT_METHODS.filter((m) => m === "COD" || m === "ONLINE"),
    });
    const orderId = await createOrderFromValidated(validated);
    return NextResponse.json({ orderId }, { status: 201 });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
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