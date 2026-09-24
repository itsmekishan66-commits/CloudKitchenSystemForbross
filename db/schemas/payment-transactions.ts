/**
 * ============================================================
 * PAYMENT METHOD — Gateway transaction tracking
 * ============================================================
 * This table records every online payment initiated through an
 * external payment gateway (eSewa ePay, Khalti KPG-2, ...).
 *
 * It is an AUDIT / RECONCILIATION layer: it stores the gateway
 * reference ids returned by the provider so that:
 *   - a callback can be matched back to the originating order,
 *   - payment confirmations stay idempotent (a transaction can
 *     only be marked as paid once),
 *   - full provider payloads are kept for debugging & refunds.
 *
 * PAY-ON-SUCCESS FLOW: for ESEWA/KHALTI the order does NOT exist yet
 * when the payment session is created. `order_id` is nullable and the
 * validated + server-priced checkout payload is stored in
 * `order_payload`; the order is created only after the gateway
 * confirms the payment (verify step links it via `order_id`).
 *
 * SECURITY: no card / wallet credentials are ever stored here.
 * Only provider-issued reference ids and statuses are persisted.
 * ============================================================
 */
import {
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { orders } from "./orders";

export const paymentTransactions = mysqlTable("payment_transactions", {
  id: int("id").autoincrement().primaryKey(),

  // The order this payment belongs to. NULL while the payment session
  // exists but the order has not been created yet (pay-on-success flow);
  // the verify step sets it once the order is created.
  orderId: int("order_id").references(() => orders.id, { onDelete: "cascade" }),

  // Provider that processed the payment.
  provider: mysqlEnum("provider", ["esewa", "khalti"]).notNull(),

  // eSewa: merchant-generated unique transaction_uuid.
  // Khalti: merchant-generated purchase_order_id.
  transactionUuid: varchar("transaction_uuid", { length: 128 }).notNull(),

  // Khalti: the payment id (pidx) returned at initiate time.
  pidx: varchar("pidx", { length: 64 }),

  // Provider-issued reference for the settled transaction.
  // eSewa: transaction_code. Khalti: transaction_id.
  gatewayRefId: varchar("gateway_ref_id", { length: 128 }),

  // Authoritative amount charged (as stored on the order).
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),

  // Validated order payload stored at initiate time (pay-on-success flow).
  // The order row doesn't exist yet; this snapshot is used by the verify
  // step to create the order only after the gateway confirms payment.
  orderPayload: json("order_payload"),

  status: mysqlEnum("status", [
    "initiated", // payment session created, not yet paid
    "success", // verified as paid
    "failed", // provider reported failure
    "cancelled", // user cancelled the payment page
    "expired", // payment link/session expired
    "pending", // still processing (eSewa PENDING / Khalti Pending)
  ])
    .notNull()
    .default("initiated"),

  // Full provider callback/lookup payload, for audit & support.
  rawResponse: json("raw_response"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type NewPaymentTransaction = typeof paymentTransactions.$inferInsert;