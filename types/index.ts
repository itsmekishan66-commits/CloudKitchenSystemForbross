import type { User } from "@/db/schemas";
export type { User, NewUser } from "@/db/schemas";
export type { Order, NewOrder, OrderItem, NewOrderItem } from "@/db/schemas";
export type { MenuItem, NewMenuItem } from "@/db/schemas";
export type { Category, NewCategory } from "@/db/schemas";
export type { Kitchen, NewKitchen } from "@/db/schemas";
export type { InventoryItem, NewInventoryItem } from "@/db/schemas";
export type { SupportTicket, NewSupportTicket } from "@/db/schemas";
export type { Promotion, NewPromotion } from "@/db/schemas";
export type { ActivityLog, NewActivityLog } from "@/db/schemas";
export type { CartItem } from "@/store/cartStore";
export type UserRole = string;

export type OrderStatus =
  | "Pending"
  | "Preparing"
  | "Out For Delivery"
  | "Delivered"
  | "Cancelled";

export type PaymentMethod = "COD" | "ONLINE";

export type ApiResponse<T = unknown> = {
  data?: T;
  error?: string;
  status: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type SessionPayload = {
  userId: number;
  role: UserRole;
};
