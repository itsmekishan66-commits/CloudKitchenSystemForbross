/**
 * ============================================================
 * PAYMENT METHOD — eSewa (ePay v2)
 * ============================================================
 * Server-side integration for the eSewa ePay v2 web payment
 * flow (form POST + transaction status verification).
 *
 * Official docs (read before implementing):
 *   - ePay:  https://developer.esewa.com.np/pages/Epay
 *   - Status: https://developer.esewa.com.np/pages/Status
 *
 * FLOW
 *   1. Server builds the signed form fields (HMAC-SHA256 over
 *      `total_amount,transaction_uuid,product_code`).
 *   2. The browser POSTs those fields to eSewa's payment page.
 *   3. eSewa redirects back to success_url / failure_url with a
 *      base64-encoded response payload.
 *   4. Server decodes the payload, verifies the response
 *      signature, re-checks the amount against the DB order,
 *      and calls the eSewa transaction-status API server-side
 *      before marking the order as paid.
 *
 * SECURITY
 *   - Secrets are read from process.env ONLY (server-only).
 *     NEVER expose ESEWA_SECRET_KEY via NEXT_PUBLIC_*.
 *   - Amounts are always recomputed from the order in the DB;
 *     the value signed here is the authoritative order total.
 *   - The callback payload is signature-verified (timing-safe),
 *     and the status-check API is an additional server-to-server
 *     confirmation — a bare redirect is never trusted.
 *   - Test (UAT) credentials are used by default so local dev
 *     works out of the box; production values come from env.
 * ============================================================
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export type EsewaConfig = {
  productCode: string;
  secretKey: string;
  paymentUrl: string;
  statusUrl: string;
};

export function getEsewaConfig(): EsewaConfig {
  return {
    productCode: process.env.ESEWA_PRODUCT_CODE || "EPAYTEST",
    secretKey: process.env.ESEWA_SECRET_KEY || "",
    // Test payment page (rc-epay.esewa.com.np). Production: https://epay.esewa.com.np/api/epay/main/v2/form
    paymentUrl:
      process.env.ESEWA_PAYMENT_URL ||
      "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
    // Test status endpoint (rc.esewa.com.np). Production: https://esewa.com.np/api/epay/transaction/status/
    statusUrl:
      process.env.ESEWA_STATUS_URL ||
      "https://rc.esewa.com.np/api/epay/transaction/status/",
  };
}

/** Build the signature message: `key=value,key=value,...` for fields in signedFieldNames order. */
export function buildSignedMessage(
  fields: Record<string, string>,
  signedFieldNames: string[],
): string {
  return signedFieldNames.map((name) => `${name}=${fields[name] ?? ""}`).join(",");
}

/** HMAC-SHA256 signature, base64-encoded (as required by eSewa). */
export function generateEsewaSignature(message: string, secretKey: string): string {
  return createHmac("sha256", secretKey).update(message).digest("base64");
}

/** Timing-safe signature comparison. */
export function verifyEsewaSignature(
  message: string,
  signature: string,
  secretKey: string,
): boolean {
  const expected = createHmac("sha256", secretKey).update(message).digest();
  const received = Buffer.from(signature || "", "base64");
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

/**
 * Build the form fields POSTed to eSewa's payment page.
 * The browser performs the actual form submission.
 */
export function buildEsewaFormFields(
  config: EsewaConfig,
  payload: {
    transactionUuid: string;
    totalAmount: string;
    successUrl: string;
    failureUrl: string;
  },
): { formAction: string; fields: Record<string, string> } {
  const signedFieldNames = ["total_amount", "transaction_uuid", "product_code"];

  // eSewa requires all amounts as numeric strings. total_amount is the
  // authoritative order total (includes delivery, after discounts).
  const fields: Record<string, string> = {
    amount: payload.totalAmount,
    tax_amount: "0",
    total_amount: payload.totalAmount,
    transaction_uuid: payload.transactionUuid,
    product_code: config.productCode,
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url: payload.successUrl,
    failure_url: payload.failureUrl,
    signed_field_names: signedFieldNames.join(","),
    signature: "",
  };

  fields.signature = generateEsewaSignature(
    buildSignedMessage(fields, signedFieldNames),
    config.secretKey,
  );

  return { formAction: config.paymentUrl, fields };
}

/**
 * Decode + verify the base64-encoded callback payload that eSewa
 * appends to the success / failure URL.
 *
 * Returns the parsed payload when the response signature is valid,
 * otherwise null (caller must reject the callback).
 */
export function decodeAndVerifyEsewaResponse(
  config: EsewaConfig,
  data: string,
): Record<string, string> | null {
  let decoded: string;
  try {
    decoded = Buffer.from(data, "base64").toString("utf8");
  } catch {
    return null;
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }

  const signedFieldNamesRaw = payload.signed_field_names;
  const signature = payload.signature;

  if (
    typeof signedFieldNamesRaw !== "string" ||
    !signedFieldNamesRaw.trim() ||
    typeof signature !== "string" ||
    !signature
  ) {
    return null;
  }

  const signedFieldNames = signedFieldNamesRaw.split(",").map((f) => f.trim());

  const stringPayload: Record<string, string> = {};
  for (const name of signedFieldNames) {
    const value = payload[name];
    stringPayload[name] = typeof value === "string" || typeof value === "number" ? String(value) : "";
  }

  const message = buildSignedMessage(stringPayload, signedFieldNames);
  if (!verifyEsewaSignature(message, signature, config.secretKey)) {
    return null;
  }

  return stringPayload;
}

/**
 * Server-to-server confirmation that a transaction really
 * completed on eSewa's side (authoritative — never trust a
 * browser redirect / hidden form alone).
 *
 * Returns the raw status string, e.g. "COMPLETE", "PENDING",
 * "CANCELED", "FULL_REFUND", "PARTIAL_REFUND", "AMBIGUOUS",
 * "NOT_FOUND".
 */
export async function checkEsewaTransactionStatus(
  config: EsewaConfig,
  params: { transactionUuid: string; totalAmount: string },
): Promise<string> {
  const query = new URLSearchParams({
    product_code: config.productCode,
    total_amount: params.totalAmount,
    transaction_uuid: params.transactionUuid,
  }).toString();

  const res = await fetch(`${config.statusUrl}?${query}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`eSewa status check failed with HTTP ${res.status}`);
  }

  const body = (await res.json()) as { status?: string };
  return body.status ?? "";
}

export const ESEWA_SUCCESS_STATUS = "COMPLETE";