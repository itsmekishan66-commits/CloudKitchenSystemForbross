/**
 * ============================================================
 * PAYMENT METHOD — eSewa (ePay v2) verify
 * ============================================================
 * Receives the base64 callback payload that eSewa appends to the
 * success URL, then:
 *   1. decodes + signature-verifies the payload,
 *   2. matches the transaction_uuid to a stored payment session,
 *   3. re-checks the amount against the authoritative amount stored on
 *      the payment session,
 *   4. confirms the status via the eSewa status-check API
 *      (server-to-server — a browser redirect is never trusted).
 *
 * PAY-ON-SUCCESS:
 *   - The ORDER is created HERE (from the validated snapshot stored at
 *     initiate time) only when every check above passes. Nothing is
 *     created before the payment is confirmed.
 *   - Verification is idempotent — a transaction that already created its
 *     order simply returns ok.
 *   - Failed / cancelled payments only update the transaction status; no
 *     order is created.
 * ============================================================
 */
import { NextResponse } from "next/server";
import { getOrderById, markOrderPaymentSettled } from "@/db/services/orders";
import {
  getPaymentTransactionByUuid,
  updatePaymentTransaction,
  recordGatewayReceivedTransaction,
} from "@/db/services/paymentTransactions";
import { createOrderFromValidated, type ValidatedCheckout } from "@/db/services/checkout";
import {
  decodeAndVerifyEsewaResponse,
  checkEsewaTransactionStatus,
  ESEWA_SUCCESS_STATUS,
  getEsewaConfig,
} from "@/lib/payments/esewa";
import { rateLimit, getClientIdentifier } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const limit = rateLimit(getClientIdentifier(request, "esewa-verify"), {
      windowMs: 60_000,
      max: 30,
    });
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const body = (await request.json().catch(() => null)) as { data?: string };
    if (!body?.data) {
      return NextResponse.json({ error: "Missing eSewa response data" }, { status: 400 });
    }

    const config = getEsewaConfig();
    const payload = decodeAndVerifyEsewaResponse(config, body.data);

    if (!payload) {
      return NextResponse.json({ error: "Invalid eSewa response signature" }, { status: 400 });
    }

    const { transaction_uuid: transactionUuid, total_amount: totalAmount, status, transaction_code: transactionCode } = payload;

    if (
      !transactionUuid ||
      !totalAmount ||
      !status ||
      !transactionCode
    ) {
      return NextResponse.json({ error: "Incomplete eSewa response" }, { status: 400 });
    }

    const paymentTxn = await getPaymentTransactionByUuid(transactionUuid, "esewa");
    if (!paymentTxn) {
      return NextResponse.json(
        { error: "Unknown eSewa transaction" },
        { status: 404 },
      );
    }

    // Re-check the paid amount against the authoritative amount stored on
    // the payment session (validated server-side at initiate time).
    if (Math.abs(Number(totalAmount) - Number(paymentTxn.amount)) > 0.01) {
      await updatePaymentTransaction(paymentTxn.id, {
        status: "failed",
        rawResponse: payload,
      });
      return NextResponse.json({ error: "Paid amount does not match order total" }, { status: 400 });
    }

    // Authoritative server-to-server confirmation with eSewa.
    const transactionStatus = await checkEsewaTransactionStatus(config, {
      transactionUuid,
      totalAmount,
    });

    if (transactionStatus !== ESEWA_SUCCESS_STATUS) {
      // Payment NOT confirmed — mark the session and create nothing.
      await updatePaymentTransaction(paymentTxn.id, {
        status: transactionStatus === "CANCELED" ? "cancelled" : "pending",
        rawResponse: payload,
      });
      return NextResponse.json(
        { error: `eSewa reported status: ${transactionStatus}` },
        { status: 400 },
      );
    }

    if (status !== ESEWA_SUCCESS_STATUS) {
      await updatePaymentTransaction(paymentTxn.id, {
        status: "failed",
        rawResponse: payload,
      });
      return NextResponse.json({ error: "eSewa callback status is not COMPLETE" }, { status: 400 });
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
      gatewayRefId: transactionCode,
      rawResponse: payload,
    });

    // Ledger hook: book the online receipt into the `transactions` table so it
    // appears in /payment and in payment-account balances. Idempotent via the
    // ESEWA-<code> transactionId. Best-effort: a ledger failure must not turn a
    // verified payment into an error response for the customer.
    try {
      await recordGatewayReceivedTransaction({
        orderId: order.id,
        amount: order.total,
        provider: "esewa",
        gatewayRefId: transactionCode,
      });
    } catch (error) {
      console.error("eSewa ledger hook failed", error);
    }

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (error) {
    console.error("eSewa verify failed", error);
    return NextResponse.json({ error: "Unable to verify eSewa payment" }, { status: 500 });
  }
}