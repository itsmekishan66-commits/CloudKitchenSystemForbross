export const APP_NAME = "Cloud Kitchen";
export const APP_DESCRIPTION = "Order delicious food from our cloud kitchen";

export const ORDER_STATUSES = [
  "Pending",
  "Preparing",
  "Out For Delivery",
  "Delivered",
  "Cancelled",
] as const;

export const PAYMENT_METHODS = ["COD", "ONLINE", "ESEWA", "KHALTI"] as const;

/** Payment methods whose money is collected online at checkout. */
export const PREPAID_PAYMENT_METHODS = ["ONLINE", "ESEWA", "KHALTI"] as const;

/**
 * True when an order was already paid online at checkout time, so no COD
 * settlement is required when it is delivered.
 *
 * The gateway verify routes (eSewa / Khalti) confirm the payment
 * server-to-server and then create the order with `paymentSettled: true`, so
 * that flag is the authoritative "money is already in the account" signal —
 * the payment method alone only means the customer *chose* to pay online.
 * A leftover `dueAmount` still wins: those orders do need settling.
 */
export function isPrepaidOrder(order: {
  paymentMethod: string;
  paymentSettled?: number | boolean | null;
  dueAmount?: string | number | null;
}): boolean {
  return (
    (PREPAID_PAYMENT_METHODS as readonly string[]).includes(order.paymentMethod) &&
    Boolean(order.paymentSettled) &&
    Number(order.dueAmount ?? 0) <= 0
  );
}

// this is the code we used for static data before , which is now not useful as we adding roles and permission dynamically
// export const USER_ROLES = [
//   "super-admin",
//   "admin",
//   "staff",
//   "customer",
// ] as const;

// export const ADMIN_ROLES = ["super-admin", "admin", "staff"] as const;

export const MAX_CART_ITEMS = 50;
export const MAX_ORDER_QUANTITY = 100;

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const PAGINATION_DEFAULTS = {
  page: 1,
  pageSize: 12,
  maxPageSize: 100,
} as const;
