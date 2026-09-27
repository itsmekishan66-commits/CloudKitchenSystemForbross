/**
 * ============================================================
 * PAYMENT METHOD — Khalti (KPG-2 Web Checkout)
 * ============================================================
 * Server-side integration for the Khalti Payment Gateway 2
 * "web checkout" flow (hosted page redirect).
 *
 * Official docs (read before implementing):
 *   - https://docs.khalti.com/kpg/#khalti-payment-gateway
 *   - https://docs.khalti.com/kpg/#getting-started
 *
 * FLOW
 *   1. Server POSTs an initiate request to Khalti
 *      (`/api/v2/epayment/initiate/`) with the Bearer secret and
 *      receives `pidx` + `payment_url`.
 *   2. The browser is redirected to `payment_url` (hosted page).
 *   3. Khalti redirects the browser back to return_url with query
 *      params (pidx, status, ...).
 *   4. Server NEVER trusts the browser redirect alone — it calls
 *      the Khalti lookup API (`/api/v2/epayment/lookup/`) and
 *      only a status of "Completed" (with a matching amount)
 *      marks the order as paid.
 *
 * SECURITY
 *   - Secret key is read from process.env ONLY (server-only).
 *     NEVER expose KHALTI_SECRET_KEY via NEXT_PUBLIC_*.
 *   - Amounts are always computed server-side from the DB order,
 *     in paisa (1 NPR = 100 paisa), as Khalti expects.
 *   - Final confirmation always goes through the lookup API;
 *     redirect query params are never trusted.
 *   - Sandbox (dev.khalti.com) is the default; production values
 *     come from env.
 * ============================================================
 */

export type KhaltiConfig = {
  secretKey: string;
  apiBaseUrl: string;
};

export function getKhaltiConfig(): KhaltiConfig {
  return {
    secretKey: process.env.KHALTI_SECRET_KEY || "",
    // Test base URL (dev.khalti.com). Production: https://khalti.com/api/v2/
    apiBaseUrl:
      process.env.KHALTI_API_BASE_URL || "https://dev.khalti.com/api/v2/",
  };
}

export type KhaltiInitiatePayload = {
  /** Where Khalti redirects the browser after payment. */
  returnUrl: string;
  /** Merchant website URL. */
  websiteUrl: string;
  /** Amount in paisa (1 NPR = 100 paisa), must be an integer. */
  amountPaisa: number;
  /** Unique merchant order reference. */
  purchaseOrderId: string;
  /** Human readable order name shown on the Khalti page. */
  purchaseOrderName?: string;
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

export type KhaltiInitiateResult = {
  pidx: string;
  paymentUrl: string;
  expiresAt: string;
  expiresIn: number;
};

/**
 * Initialize a Khalti payment. Called server-side so the secret
 * key never reaches the browser.
 */
export async function initiateKhaltiPayment(
  payload: KhaltiInitiatePayload,
  config: KhaltiConfig,
): Promise<KhaltiInitiateResult> {
  const res = await fetch(`${config.apiBaseUrl}epayment/initiate/`, {
    method: "POST",
    headers: {
      Authorization: `Key ${config.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      return_url: payload.returnUrl,
      website_url: payload.websiteUrl,
      amount: payload.amountPaisa,
      purchase_order_id: payload.purchaseOrderId,
      purchase_order_name: payload.purchaseOrderName ?? "Order",
      customer_info: payload.customerInfo,
    }),
    cache: "no-store",
  });

  // Khalti's API returns snake_case keys (payment_url, expires_at, ...).
  const body = (await res.json().catch(() => null)) as
    | { pidx?: string; payment_url?: string; expires_at?: string; expires_in?: number; detail?: string }
    | null;

  if (!res.ok || !body || !body.pidx || !body.payment_url) {
    throw new Error(body?.detail || `Khalti initiate failed with HTTP ${res.status}`);
  }

  return {
    pidx: body.pidx as string,
    paymentUrl: body.payment_url as string,
    expiresAt: body.expires_at as string,
    expiresIn: Number(body.expires_in ?? 0),
  };
}

export type KhaltiLookupStatus =
  | "Completed"
  | "Pending"
  | "Initiated"
  | "Refunded"
  | "Expired"
  | "User canceled"
  | "Partially refunded";

export type KhaltiLookupResult = {
  pidx: string;
  /** Amount actually paid, in paisa. */
  totalAmount: number;
  status: KhaltiLookupStatus;
  /** Provider-issued reference for the settled transaction (e.g. `8EVLYgQJosvyGQEYBftRRy`). */
  transactionId: string;
  fee: number;
  refunded: boolean;
};

/**
 * Shape of the `epayment/lookup/` response body.
 *
 * NOTE: the server-side lookup API returns SNAKE_CASE keys
 * (`total_amount`, `transaction_id`). Only `pidx`, `status`, `fee` and
 * `refunded` look camel-ish because they are single words. The camelCase
 * spellings are accepted as a fallback because the Khalti *client* SDK
 * (and some proxy wrappers) return that shape instead — reading only one
 * spelling silently yields 0 / "" and breaks amount verification.
 */
type KhaltiLookupBody = {
  pidx?: string;
  status?: string;
  total_amount?: number;
  transaction_id?: string;
  totalAmount?: number;
  transactionId?: string;
  fee?: number;
  refunded?: boolean;
  detail?: string;
};

/**
 * Confirm a payment's real status with Khalti (server-to-server).
 * Only `status === "Completed"` counts as success.
 */
export async function lookupKhaltiPayment(
  pidx: string,
  config: KhaltiConfig,
): Promise<KhaltiLookupResult> {
  const res = await fetch(`${config.apiBaseUrl}epayment/lookup/`, {
    method: "POST",
    headers: {
      Authorization: `Key ${config.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pidx }),
    cache: "no-store",
  });

  const body = (await res.json().catch(() => null)) as KhaltiLookupBody | null;

  if (!res.ok || !body || !body.status) {
    throw new Error(body?.detail || `Khalti lookup failed with HTTP ${res.status}`);
  }

  return {
    pidx: body.pidx ?? pidx,
    // snake_case first, camelCase fallback (see KhaltiLookupBody).
    totalAmount: Number(body.total_amount ?? body.totalAmount ?? 0),
    status: body.status as KhaltiLookupStatus,
    transactionId: body.transaction_id ?? body.transactionId ?? "",
    fee: Number(body.fee ?? 0),
    refunded: body.refunded ?? false,
  };
}

/** Convert a rupee amount (string or number) to integer paisa. */
export function rupeesToPaisa(amount: string | number): number {
  return Math.round(Number(amount) * 100);
}

export const KHALTI_SUCCESS_STATUS: KhaltiLookupStatus = "Completed";