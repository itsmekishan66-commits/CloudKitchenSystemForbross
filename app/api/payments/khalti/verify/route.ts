/**
 * ============================================================
 * PAYMENT METHOD — Khalti (KPG-2 Web Checkout) verify
 * ============================================================
 * Confirms a Khalti payment via the lookup API (server-to-server)
 * using the pidx returned in the return_url redirect.
 *
 * PAY-ON-SUCCESS:
 *   - The ORDER is created HERE (from the validated snapshot stored at
 *     initiate time) only when the lookup confirms the payment.
 *   - Verification is idempotent — a transaction that already created its
 *     order simply returns ok.
 *   - A failed / cancelled / expired payment only updates the transaction
 *     status; no order is created.
 *
 * SECURITY:
 *   - The browser redirect alone is NEVER trusted; the Khalti lookup API
 *     is the source of truth.
 *   - Only a lookup status of "Completed", with an amount that matches the
 *     authoritative amount stored on the payment session (in paisa),
 *     creates + settles the order.
 * ============================================================
 */
import { NextResponse } from "next/server";
import { getOrderById, markOrderPaymentSettled } from "@/db/services/orders";
import {
  getPaymentTransactionByPidx,
  updatePaymentTransaction,
  recordGatewayReceivedTransaction,
} from "@/db/services/paymentTransactions";
import { createOrderFromValidated, type ValidatedCheckout } from "@/db/services/checkout";
import {
  getKhaltiConfig,
  lookupKhaltiPayment,
  rupeesToPaisa,
  KHALTI_SUCCESS_STATUS,
} from "@/lib/payments/khalti";
import { rateLimit, getClientIdentifier } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const limit = rateLimit(getClientIdentifier(request, "khalti-verify"), {
      windowMs: 60_000,
      max: 30,
    });
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const body = (await request.json().catch(() => null)) as { pidx?: string };
    const pidx = body?.pidx;

    if (!pidx || typeof pidx !== "string") {
      return NextResponse.json({ error: "Missing Khalti pidx" }, { status: 400 });
    }

    const paymentTxn = await getPaymentTransactionByPidx(pidx);
    if (!paymentTxn) {
      return NextResponse.json({ error: "Unknown Khalti transaction" }, { status: 404 });
    }

    const config = getKhaltiConfig();
    if (!config.secretKey) {
      return NextResponse.json({ error: "Khalti is not configured" }, { status: 503 });
    }

    const result = await lookupKhaltiPayment(pidx, config);

    // Only a Completed payment (verified server-side) counts.
    if (result.status !== KHALTI_SUCCESS_STATUS) {
      // Payment NOT confirmed — mark the session and create nothing.
      const status = result.status;
      if (status === "User canceled") {
        await updatePaymentTransaction(paymentTxn.id, { status: "cancelled", rawResponse: result as unknown as Record<string, unknown> });
      } else if (status === "Expired") {
        await updatePaymentTransaction(paymentTxn.id, { status: "expired", rawResponse: result as unknown as Record<string, unknown> });
      } else {
        await updatePaymentTransaction(paymentTxn.id, { status: "pending", rawResponse: result as unknown as Record<string, unknown> });
      }
      return NextResponse.json(
        { error: `Khalti reported status: ${status}` },
        { status: 400 },
      );
    }

    // Amount re-check against the authoritative amount stored on the
    // payment session. Khalti lookup returns the amount in paisa.
    if (result.totalAmount !== rupeesToPaisa(paymentTxn.amount)) {
      await updatePaymentTransaction(paymentTxn.id, {
        status: "failed",
        rawResponse: result as unknown as Record<string, unknown>,
      });
      return NextResponse.json({ error: "Paid amount does not match order total" }, { status: 400 });
    }

    // Payment confirmed. If the order was not created yet (pay-on-success),
    // create it now from the validated snapshot. Idempotent: an already
    // created order is reused.
    let orderId = paymentTxn.orderId;

    if (!orderId) {
      const snapshot = paymentTxn.orderPayload as unknown as ValidatedCheckout | null;
      if (!snapshot) {
        return NextResponse.json(
          { error: "Payment session has no order snapshot" },
          { status: 400 },
        );
      }
      orderId = await createOrderFromValidated(snapshot, { paymentSettled: true });
      await updatePaymentTransaction(paymentTxn.id, { orderId });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotent settle.
    if (!order.paymentSettled) {
      await markOrderPaymentSettled(order.id);
    }
    await updatePaymentTransaction(paymentTxn.id, {
      status: "success",
      gatewayRefId: result.transactionId,
      rawResponse: result as unknown as Record<string, unknown>,
    });

    // Ledger hook: book the online receipt into the `transactions` table so it
    // appears in /payment and in payment-account balances. Idempotent via the
    // KHALTI-<transactionId> transactionId. Best-effort: a ledger failure must
    // not turn a verified payment into an error response for the customer.
    try {
      await recordGatewayReceivedTransaction({
        orderId: order.id,
        amount: order.total,
        provider: "khalti",
        gatewayRefId: result.transactionId,
      });
    } catch (error) {
      console.error("Khalti ledger hook failed", error);
    }

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (error) {
    console.error("Khalti verify failed", error);
    return NextResponse.json({ error: "Unable to verify Khalti payment" }, { status: 500 });
  }
}