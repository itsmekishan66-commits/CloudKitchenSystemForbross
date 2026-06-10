export const APP_NAME = "Cloud Kitchen";
export const APP_DESCRIPTION = "Order delicious food from our cloud kitchen";

export const ORDER_STATUSES = [
  "Pending",
  "Preparing",
  "Out For Delivery",
  "Delivered",
  "Cancelled",
] as const;

export const PAYMENT_METHODS = ["COD", "ONLINE"] as const;

export const USER_ROLES = [
  "super-admin",
  "admin",
  "staff",
  "customer",
] as const;

export const ADMIN_ROLES = ["super-admin", "admin", "staff"] as const;

export const MAX_CART_ITEMS = 50;
export const MAX_ORDER_QUANTITY = 100;

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const PAGINATION_DEFAULTS = {
  page: 1,
  pageSize: 12,
  maxPageSize: 100,
} as const;
