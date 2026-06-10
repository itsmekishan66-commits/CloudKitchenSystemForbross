import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  orderItems,
  orders,
  type NewOrder,
  type NewOrderItem,
  menuItems,
  users,
} from "@/db/schemas";

type CreateOrderInput = NewOrder & {
  items: Omit<NewOrderItem, "id" | "orderId">[];
};

export async function getOrders() {
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getOrdersByUserId(userId: number) {
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) {
    return null;
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));

  return { ...order, items };
}

export async function createOrder({ items, ...order }: CreateOrderInput) {
  return db.transaction(async (tx) => {
    const result = await tx.insert(orders).values(order);
    const orderId = result[0].insertId;

    if (items.length > 0) {
      await tx.insert(orderItems).values(
        items.map((item) => ({
          ...item,
          orderId,
        })),
      );
    }

    return orderId;
  });
}

export async function updateOrderStatus(
  id: number,
  status: NewOrder["status"],
) {
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

export async function getDashboardStats() {
  const [orderStats] = await db
    .select({
      totalOrders: sql<number>`count(*)`,
      revenue: sql<string>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(orders);

  const [customerStats] = await db
    .select({
      totalCustomers: sql<number>`count(*)`,
    })
    .from(users)
    .where(eq(users.role, "customer"));

  const [menuStats] = await db
    .select({
      totalMenuItems: sql<number>`count(*)`,
    })
    .from(menuItems);

  return {
    totalOrders: Number(orderStats?.totalOrders ?? 0),
    revenue: Number(orderStats?.revenue ?? 0),
    totalCustomers: Number(customerStats?.totalCustomers ?? 0),
    totalMenuItems: Number(menuStats?.totalMenuItems ?? 0),
  };
}
