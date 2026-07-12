import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  inventoryItems,
  orderItems,
  orders,
  roles,
  type NewOrder,
  type NewOrderItem,
  menuItems,
  supplierProducts,
  users,
} from "@/db/schemas";
import { recordOrderSale } from "@/db/services/accounting";

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
      landmarkName: orders.landmarkName,
      discountAmount: orders.discountAmount,
      dueAmount: orders.dueAmount,
      paymentSettled: orders.paymentSettled,
      notes: orders.notes,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      userEmail: users.email,
      isGuest: users.isGuest,
      creditBalance: users.creditBalance,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt));


  // Fetch all order items in a single query, then group in memory (avoids N+1)
  const orderIds = rawOrders.map((o) => o.id);
  const allItems =
    orderIds.length > 0
      ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
      : [];
  const itemsByOrder = new Map<number, (typeof allItems)[number][]>();
  for (const item of allItems) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  const ordersWithItems = rawOrders.map((row) => ({
    ...row,
    userEmail: row.userEmail ?? null,
    isGuest: row.isGuest ?? false,
    items: itemsByOrder.get(row.id) ?? [],
  }));

  // Compute previous dues per customer
  const duesByUser = new Map<number, number>();
  for (const o of ordersWithItems) {
    if (!o.userId) continue;
    const due = Number(o.dueAmount) || 0;
    if (due > 0) {
      duesByUser.set(o.userId, (duesByUser.get(o.userId) || 0) + due);
    }
  }
  const seenUser = new Set<number>();
  return ordersWithItems.map((order) => {
    let previousDues = 0;
    if (order.userId) {
      if (!seenUser.has(order.userId)) {
        seenUser.add(order.userId);
        previousDues = Math.max(
          0,
          (duesByUser.get(order.userId) || 0) - (Number(order.dueAmount) || 0),
        );
      }
    }
    return { ...order, previousDues, userCreditBalance: Number(order.creditBalance ?? 0) };
  });
}

export async function getOrderWithDetailsById(orderId: number) {
  const [row] = await db
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
      landmarkName: orders.landmarkName,
      discountAmount: orders.discountAmount,
      dueAmount: orders.dueAmount,
      paymentSettled: orders.paymentSettled,
      notes: orders.notes,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      userEmail: users.email,
      isGuest: users.isGuest,
      creditBalance: users.creditBalance,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!row) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const order = {
    ...row,
    userEmail: row.userEmail ?? null,
    isGuest: row.isGuest ?? false,
    items,
  };

  // Previous dues = sum of due amounts on the customer's other orders.
  let previousDues = 0;
  if (order.userId) {
    const others = await db
      .select({ due: orders.dueAmount })
      .from(orders)
      .where(and(eq(orders.userId, order.userId), sql`${orders.id} != ${orderId}`));
    previousDues = Math.max(
      0,
      others.reduce((sum, o) => sum + (Number(o.due) || 0), 0),
    );
  }

  return { ...order, previousDues, userCreditBalance: Number(order.creditBalance ?? 0) };
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
  await db.transaction(async (tx) => {
    const [existingOrder] = await tx.select().from(orders).where(eq(orders.id, id)).limit(1);

    if (!existingOrder) {
      throw new Error("Order not found");
    }

    if (status === "Delivered" && existingOrder.status !== "Delivered") {
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));

      for (const item of items) {
        const menuItemId = item.menuItemId ?? null;
        if (!menuItemId) continue;

        const [linkedProduct] = await tx
          .select()
          .from(supplierProducts)
          .where(and(eq(supplierProducts.menuItemId, menuItemId), eq(supplierProducts.productType, "direct_sellable")))
          .limit(1);

        if (!linkedProduct || !linkedProduct.inventoryItemId) continue;

        const [inventoryItem] = await tx
          .select()
          .from(inventoryItems)
          .where(eq(inventoryItems.id, linkedProduct.inventoryItemId))
          .limit(1);

        if (!inventoryItem) continue;

        const soldQuantity = Number(item.quantity) || 0;
        const currentStock = Number(inventoryItem.quantity) || 0;
        if (currentStock < soldQuantity) {
          throw new Error(`Insufficient stock for ${linkedProduct.name}`);
        }

        const unitsPerPack = Number(linkedProduct.unitsPerPack) || 1;
        const remainingSupplierStock = Math.max(0, Number(linkedProduct.quantity || 0) - soldQuantity / unitsPerPack);
        const remainingInventoryStock = currentStock - soldQuantity;

        await tx
          .update(supplierProducts)
          .set({ quantity: remainingSupplierStock.toFixed(2) })
          .where(eq(supplierProducts.id, linkedProduct.id));

        await tx
          .update(inventoryItems)
          .set({ quantity: remainingInventoryStock.toFixed(2) })
          .where(eq(inventoryItems.id, linkedProduct.inventoryItemId));
      }
    }

    await tx.update(orders).set({ status }).where(eq(orders.id, id));
  });

  if (status === "Delivered") {
    try {
      const order = await getOrderById(id);
      if (order) {
        await recordOrderSale({
          id,
          total: order.total,
          dueAmount: order.dueAmount ?? "0",
          items: order.items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: Number(i.quantity),
          })),
        });
      }
    } catch (err) {
      console.error("Failed to record accounting entry for order", id, err);
    }
  }
}

export async function updateOrderPaymentStatus(id: number, settled: boolean, dueAmount?: string | number) {
  const updateData: { paymentSettled: boolean; dueAmount?: string } = { paymentSettled: settled };

  if (dueAmount !== undefined) {
    updateData.dueAmount = String(dueAmount);
  }

  await db.update(orders).set(updateData).where(eq(orders.id, id));
}

export async function markOrderPaymentSettled(id: number) {
  await updateOrderPaymentStatus(id, true, "0.00");
}

export async function getUserOrdersWithItems(userId: number) {
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  const orderIds = userOrders.map((o) => o.id);
  const allItems =
    orderIds.length > 0
      ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
      : [];
  const itemsByOrder = new Map<number, (typeof allItems)[number][]>();
  for (const item of allItems) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  return userOrders.map((order) => ({
    ...order,
    items: itemsByOrder.get(order.id) ?? [],
  }));
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
      totalDues: sql<string>`coalesce(sum(${orders.dueAmount}), 0)`,
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

  const orderTotal = Number(deliveredStats?.totalSpent ?? 0);
  const dues = Number(deliveredStats?.totalDues ?? 0);

  const [user] = await db
    .select({ creditBalance: users.creditBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const creditBalance = Number(user?.creditBalance ?? 0);

  return {
    totalOrders: Number(orderStats?.totalOrders ?? 0),
    totalSpent: orderTotal + dues,
    totalSaved: Number(deliveredStats?.totalSaved ?? 0),
    totalDues: dues,
    activeOrders: Number(activeOrderCount?.count ?? 0),
    creditBalance,
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
