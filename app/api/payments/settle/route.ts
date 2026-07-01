import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { createTransaction, createDue } from "@/db/services/payments";
import { markOrderPaymentSettled } from "@/db/services/orders";
import { orders } from "@/db/schemas";
import type { NewTransaction, NewDue } from "@/db/schemas";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.CREATE_PAYMENTS);
    if (user instanceof NextResponse) return user;

    const payload = await request.json();
    const { orderId, cashAmount, onlineAmount, discount, paymentMethod, markAsDue, duePersonName, dueRole } = payload;

    const totalReceived = (Number(cashAmount) || 0) + (Number(onlineAmount) || 0);
    const discountAmount = Number(discount) || 0;

    if (totalReceived <= 0 && !markAsDue) {
      return NextResponse.json({ error: "At least one payment method or mark as due is required" }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);

    if (Number(cashAmount) > 0) {
      const txData: NewTransaction = {
        id: crypto.randomUUID(),
        type: "cash_received",
        amount: String(cashAmount),
        receivedFrom: `Order #${orderId}`,
        paymentMethod: "cash",
        notes: discountAmount > 0 ? `Discount: Rs ${discountAmount}` : null,
      };
      await createTransaction(txData);
    }

    if (Number(onlineAmount) > 0) {
      const mappedMethod = paymentMethod === "card" ? "card" : paymentMethod === "bank" ? "bank" : "esewa";
      const txData: NewTransaction = {
        id: crypto.randomUUID(),
        type: "online_received",
        amount: String(onlineAmount),
        receivedFrom: `Order #${orderId}`,
        paymentMethod: mappedMethod,
        transactionId: `SETTLE-${orderId}-${Date.now()}`,
        notes: discountAmount > 0 ? `Discount: Rs ${discountAmount}` : null,
      };
      await createTransaction(txData);
    }

    if (discountAmount > 0) {
      const txData: NewTransaction = {
        id: crypto.randomUUID(),
        type: "expense",
        amount: String(discountAmount),
        paidTo: `Discount on Order #${orderId}`,
        paymentMethod: "cash",
        notes: "Settlement discount",
      };
      await createTransaction(txData);

      const [order] = await db.select().from(orders).where(eq(orders.id, Number(orderId))).limit(1);
      if (order) {
        const currentDiscount = Number(order.discountAmount ?? 0);
        await db.update(orders).set({ discountAmount: (currentDiscount + discountAmount).toFixed(2) }).where(eq(orders.id, Number(orderId)));
      }
    }

    if (markAsDue && (Number(payload.dueAmount) > 0)) {
      const dueData: NewDue = {
        id: crypto.randomUUID(),
        personName: duePersonName || `Order #${orderId} Customer`,
        role: dueRole || "customer",
        totalDue: String(payload.dueAmount),
        paid: "0",
        remaining: String(payload.dueAmount),
        status: "pending",
      };
      await createDue(dueData);
    }

    if (Number(cashAmount) > 0 || Number(onlineAmount) > 0) {
      await markOrderPaymentSettled(Number(orderId));
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to settle payment", error);
    return NextResponse.json({ error: "Unable to settle payment" }, { status: 500 });
  }
}
