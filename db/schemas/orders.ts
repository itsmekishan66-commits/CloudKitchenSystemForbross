import {
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

import { menuItems } from "./menu-items";
import { users } from "./users";

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  customerName: varchar("customer_name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  paymentMethod: mysqlEnum("payment_method", ["COD", "ONLINE"])
    .notNull()
    .default("COD"),
  status: mysqlEnum("status", [
    "Pending",
    "Preparing",
    "Out For Delivery",
    "Delivered",
    "Cancelled",
  ])
    .notNull()
    .default("Pending"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: int("menu_item_id").references(() => menuItems.id, {
    onDelete: "set null",
  }),
  title: varchar("title", { length: 160 }).notNull(),
  quantity: int("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  meta: json("meta"),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
