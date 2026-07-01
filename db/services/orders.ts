import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  orderItems,
  orders,
  roles,
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

export async function getOrdersWithDetails() {
  const rawOrders = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      customerName: orders.customerName,
      phone: orders.phone,
      address: orders.address,
      paymentMethod: orders.paymentMethod,
      status: orders.status,
      total: orders.total,
      deliveryCharge: orders.deliveryCharge,
      discountAmount: orders.discountAmount,
      paymentSettled: orders.paymentSettled,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      userEmail: users.email,
      isGuest: users.isGuest,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt));


    //N+1 query problem

  const ordersWithItems = await Promise.all(
    rawOrders.map(async (row) => {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, row.id));
      return { ...row, userEmail: row.userEmail ?? null, isGuest: row.isGuest ?? false, items };
    }),
  );

  return ordersWithItems;
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

export async function markOrderPaymentSettled(id: number) {
  await db.update(orders).set({ paymentSettled: true }).where(eq(orders.id, id));
}

export async function getUserOrdersWithItems(userId: number) {
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  const ordersWithItems = await Promise.all(
    userOrders.map(async (order) => {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    }),
  );

  return ordersWithItems;
}

export async function getUserOrderStats(userId: number) {
  const [orderStats] = await db
    .select({
      totalOrders: sql<number>`count(*)`,
    })
    .from(orders)
    .where(eq(orders.userId, userId));

  const [deliveredStats] = await db
    .select({
      totalSpent: sql<string>`coalesce(sum(${orders.total}), 0)`,
      totalSaved: sql<string>`coalesce(sum(${orders.discountAmount}), 0)`,
    })
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.status, "Delivered")));

  const [activeOrderCount] = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(
      sql`${orders.userId} = ${userId} and ${orders.status} in ('Pending', 'Preparing', 'Out For Delivery')`,
    );

  return {
    totalOrders: Number(orderStats?.totalOrders ?? 0),
    totalSpent: Number(deliveredStats?.totalSpent ?? 0),
    totalSaved: Number(deliveredStats?.totalSaved ?? 0),
    activeOrders: Number(activeOrderCount?.count ?? 0),
  };
}

export async function getUserActiveOrder(userId: number) {
  const [activeOrder] = await db
    .select()
    .from(orders)
    .where(
      sql`${orders.userId} = ${userId} and ${orders.status} in ('Pending', 'Preparing', 'Out For Delivery')`,
    )
    .orderBy(desc(orders.createdAt))
    .limit(1);

  if (!activeOrder) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, activeOrder.id));

  return { ...activeOrder, items };
}

export async function getUserFavoriteItems(userId: number) {
  const favoriteItems = await db
    .select({
      title: orderItems.title,
      count: sql<number>`count(*)`,
      price: sql<string>`max(${orderItems.price})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(eq(orders.userId, userId))
    .groupBy(orderItems.title)
    .orderBy(desc(sql`count(*)`))
    .limit(6);

  return favoriteItems;
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
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(roles.name, "customer"));

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
