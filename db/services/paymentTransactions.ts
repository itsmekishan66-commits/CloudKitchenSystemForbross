/**
 * ============================================================
 * PAYMENT METHOD — gateway transaction persistence helpers
 * ============================================================
 * CRUD helpers for the `payment_transactions` table, which is
 * the audit / reconciliation layer between orders and external
 * payment gateways (eSewa ePay, Khalti KPG-2).
 *
 * SECURITY: these helpers never accept or store card/wallet
 * credentials. They only persist provider-issued reference ids
 * and statuses, and are used to keep payment confirmations
 * idempotent (a transaction can only be settled once).
 * ============================================================
 */
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  paymentTransactions,
  journalEntries,
  orders,
  type NewPaymentTransaction,
} from "@/db/schemas";
import {
  createTransaction,
  getTransactionByRef,
  getPaymentAccounts,
} from "@/db/services/payments";
import { recordCustomerPayment } from "@/db/services/accounting";

/** Insert a new gateway transaction session (status: initiated). */
export async function createPaymentTransaction(data: NewPaymentTransaction) {
  const [result] = await db.insert(paymentTransactions).values(data);
  return result.insertId;
}

/** Look up by merchant-generated unique id (eSewa transaction_uuid / Khalti purchase_order_id). */
export async function getPaymentTransactionByUuid(uuid: string, provider: "esewa" | "khalti") {
  const [row] = await db
    .select()
    .from(paymentTransactions)
    .where(
      and(
        eq(paymentTransactions.transactionUuid, uuid),
        eq(paymentTransactions.provider, provider),
      ),
    )
    .limit(1);

  return row ?? null;
}

/** Look up by Khalti payment identifier (pidx). */
export async function getPaymentTransactionByPidx(pidx: string) {
  const [row] = await db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.pidx, pidx))
    .limit(1);

  return row ?? null;
}

/** Update status / refs / raw payload for a gateway transaction. */
export async function updatePaymentTransaction(
  id: number,
  updates: Partial<NewPaymentTransaction>,
) {
  await db.update(paymentTransactions).set(updates).where(eq(paymentTransactions.id, id));
}

/**
 * List all gateway (payment_transactions) records newest first, joined with
 * the order they belong to (for customer name / order metadata in the UI).
 */
export async function getGatewayTransactions() {
  return db
    .select({
      id: paymentTransactions.id,
      orderId: paymentTransactions.orderId,
      provider: paymentTransactions.provider,
      transactionUuid: paymentTransactions.transactionUuid,
      pidx: paymentTransactions.pidx,
      gatewayRefId: paymentTransactions.gatewayRefId,
      amount: paymentTransactions.amount,
      status: paymentTransactions.status,
      createdAt: paymentTransactions.createdAt,
      updatedAt: paymentTransactions.updatedAt,
      customerName: orders.customerName,
      orderPaymentMethod: orders.paymentMethod,
    })
    .from(paymentTransactions)
    .leftJoin(orders, eq(paymentTransactions.orderId, orders.id))
    .orderBy(desc(paymentTransactions.createdAt));
}

/**
 * ============================================================
 * LEDGER HOOK — gateway payment → `transactions` row
 * ============================================================
 * After a verified gateway payment settles an order, this books an
 * `online_received` row in the `transactions` table (receivedFrom =
 * "Order #N", paymentMethod esewa/khalti) so the money shows up in
 * the /payment area and in the payment-account balances.
 *
 * ACCOUNTING: this deliberately does NOT post a journal entry here.
 * `recordOrderSale` (at delivery) reads these `Order #N` transactions
 * and books online receipts to Bank (1010) once — posting here too
 * would double-count. The only exception is an order that was ALREADY
 * delivered (its sale entry, with a receivable, was already posted):
 * in that case the receipt is booked against the receivable now.
 *
 * IDEMPOTENT: the gateway reference is stored as the transactionId
 * (ESEWA-<code> / KHALTI-<txnId>); re-verification skips recreation.
 * ============================================================
 */
export async function recordGatewayReceivedTransaction(options: {
  orderId: number;
  amount: string;
  provider: "esewa" | "khalti";
  gatewayRefId: string;
}) {
  const transactionId = `${options.provider.toUpperCase()}-${options.gatewayRefId}`;

  // Idempotency: already recorded → nothing to do.
  const existing = await getTransactionByRef(transactionId);
  if (existing) return existing;

  // Link the receipt to the first active payment account matching the
  // provider (balance matching falls back to paymentMethod when null).
  const accounts = await getPaymentAccounts();
  const account =
    accounts.find((a) => a.status === "active" && a.method === options.provider) ??
    null;

  await createTransaction({
    id: crypto.randomUUID(),
    type: "online_received",
    amount: Number(options.amount || 0).toFixed(2),
    receivedFrom: `Order #${options.orderId}`,
    paymentMethod: options.provider,
    accountId: account?.id ?? null,
    transactionId,
    notes:
      options.provider === "esewa"
        ? "Paid via eSewa (website checkout)"
        : "Paid via Khalti (website checkout)",
  });

  // If the order's sale entry was already posted (delivered before the
  // callback landed), clear the receivable — same rule as the settle route.
  const [postedOrderEntry] = await db
    .select({ id: journalEntries.id })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.referenceType, "order"),
        eq(journalEntries.referenceId, String(options.orderId)),
        eq(journalEntries.status, "posted"),
      ),
    )
    .limit(1);

  if (postedOrderEntry) {
    await recordCustomerPayment({
      orderId: options.orderId,
      amount: Number(options.amount || 0),
      referenceId: `GATEWAY-${transactionId}`,
      paymentMethod: options.provider,
    });
  }

  return null;
}