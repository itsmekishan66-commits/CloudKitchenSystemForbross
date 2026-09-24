/**
 * ============================================================
 * PAYMENT METHOD — eSewa (ePay v2) initiate
 * ============================================================
 * Validates + prices the checkout payload server-side, then opens a
 * payment session for it and returns the signed form fields that the
 * browser POSTs to eSewa's payment page.
 *
 * PAY-ON-SUCCESS FLOW:
 *   - NO order is created here. The validated order snapshot is stored on
 *     the payment transaction (`order_payload`); the order row is created
 *     by the verify endpoint only after eSewa confirms the payment.
 *   - A failed or abandoned payment therefore never leaves an order behind.
 *
 * SECURITY:
 *   - Amounts are recomputed from DB prices / zones / coupons via the
 *     shared checkout validator (client-supplied amounts ignored).
 *   - The HMAC signature is generated here with the server-side secret;
 *     no secret is ever returned to the browser.
 * ============================================================
 */
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createPaymentTransaction } from "@/db/services/paymentTransactions";
import { buildEsewaFormFields, getEsewaConfig } from "@/lib/payments/esewa";
import {
  validateAndPriceCheckout,
  CheckoutError,
  type CheckoutPayload,
} from "@/db/services/checkout";
import { rateLimit, getClientIdentifier } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const limit = rateLimit(getClientIdentifier(request, "esewa-initiate"), {
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
      allowedPaymentMethods: ["ESEWA"],
    });

    const total = Number(validated.total);
    if (!(total > 0)) {
      return NextResponse.json({ error: "Order total must be greater than zero" }, { status: 400 });
    }

    const config = getEsewaConfig();
    const totalAmount = String(total);
    const transactionUuid = `ORD-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

    const { formAction, fields } = buildEsewaFormFields(config, {
      transactionUuid,
      totalAmount,
      // NOTE: no query params here — eSewa appends `?data=<base64>` itself.
      successUrl: `${siteUrl}/payment/esewa/success`,
      failureUrl: `${siteUrl}/payment/esewa/failure`,
    });

    // Store the payment session WITHOUT an order — the validated order
    // snapshot is kept here so the verify step can create the order only
    // after eSewa confirms the payment.
    await createPaymentTransaction({
      orderId: null,
      provider: "esewa",
      transactionUuid,
      amount: validated.total.toFixed(2),
      status: "initiated",
      orderPayload: validated,
    });

    return NextResponse.json({ formAction, fields });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("eSewa initiate failed", error);
    return NextResponse.json({ error: "Unable to start eSewa payment" }, { status: 500 });
  }
}