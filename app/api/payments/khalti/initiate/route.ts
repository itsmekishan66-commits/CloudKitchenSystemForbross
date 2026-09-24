/**
 * ============================================================
 * PAYMENT METHOD — Khalti (KPG-2 Web Checkout) initiate
 * ============================================================
 * Validates + prices the checkout payload server-side, then opens a
 * Khalti payment for it and returns the hosted payment_url the browser
 * is redirected to.
 *
 * PAY-ON-SUCCESS FLOW:
 *   - NO order is created here. The validated order snapshot is stored on
 *     the payment transaction (`order_payload`); the order row is created
 *     by the verify endpoint only after Khalti confirms the payment.
 *   - A failed or abandoned payment therefore never leaves an order behind.
 *
 * SECURITY:
 *   - The amount (in paisa) is recomputed from DB prices / zones / coupons
 *     via the shared checkout validator (client-supplied amounts ignored).
 *   - Khalti's API is called from the server using the secret key
 *     (never exposed to the browser).
 * ============================================================
 */
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createPaymentTransaction } from "@/db/services/paymentTransactions";
import {
  getKhaltiConfig,
  initiateKhaltiPayment,
  rupeesToPaisa,
} from "@/lib/payments/khalti";
import {
  validateAndPriceCheckout,
  CheckoutError,
  type CheckoutPayload,
} from "@/db/services/checkout";
import { rateLimit, getClientIdentifier } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const limit = rateLimit(getClientIdentifier(request, "khalti-initiate"), {
      windowMs: 60_000,
      max: 10,
    });
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const body = (await request.json().catch(() => null)) as CheckoutPayload | null;

    const validated = await validateAndPriceCheckout(body ?? {}, {
      allowedPaymentMethods: ["KHALTI"],
    });

    const total = Number(validated.total);
    if (!(total > 0)) {
      return NextResponse.json({ error: "Order total must be greater than zero" }, { status: 400 });
    }

    const amountPaisa = rupeesToPaisa(total);

    // Khalti expects amounts in paisa and a minimum of Rs 10 (1000 paisa).
    if (amountPaisa < 1000) {
      return NextResponse.json(
        { error: "Minimum payable amount for Khalti is Rs 10" },
        { status: 400 },
      );
    }

    const config = getKhaltiConfig();
    if (!config.secretKey) {
      return NextResponse.json({ error: "Khalti is not configured" }, { status: 503 });
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
    const purchaseOrderId = `ORD${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    const result = await initiateKhaltiPayment(
      {
        // NOTE: no query params here — Khalti appends `?pidx=...&status=...` itself.
        returnUrl: `${siteUrl}/payment/khalti/return`,
        websiteUrl: siteUrl,
        amountPaisa,
        purchaseOrderId,
        purchaseOrderName: `Order — ${validated.customerName}`,
        customerInfo: {
          name: validated.customerName,
          phone: validated.phone,
        },
      },
      config,
    );

    // Store the payment session WITHOUT an order — the validated order
    // snapshot is kept here so the verify step can create the order only
    // after Khalti confirms the payment.
    await createPaymentTransaction({
      orderId: null,
      provider: "khalti",
      transactionUuid: purchaseOrderId,
      pidx: result.pidx,
      amount: validated.total.toFixed(2),
      status: "initiated",
      orderPayload: validated,
    });

    return NextResponse.json({ paymentUrl: result.paymentUrl, pidx: result.pidx });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Khalti initiate failed", error);
    return NextResponse.json({ error: "Unable to start Khalti payment" }, { status: 500 });
  }
}