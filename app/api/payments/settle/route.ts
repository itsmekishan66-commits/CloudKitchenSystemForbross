import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { createTransaction, createDue, updateDue, getDues } from "@/db/services/payments";
import { updateOrderPaymentStatus } from "@/db/services/orders";
import { recordCustomerPayment } from "@/db/services/accounting";
import { orders, users } from "@/db/schemas";
import type { NewTransaction, NewDue } from "@/db/schemas";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.CREATE_PAYMENTS);
    if (user instanceof NextResponse) return user;

    const payload = await request.json();
    const { orderId, cashAmount, onlineAmount, discount, paymentMethod, markAsDue, duePersonName, dueRole, accountId, overpayment } = payload;

    const totalReceived = (Number(cashAmount) || 0) + (Number(onlineAmount) || 0);
    const discountAmount = Number(discount) || 0;

    if (totalReceived <= 0 && !markAsDue) {
      return NextResponse.json({ error: "At least one payment method or mark as due is required" }, { status: 400 });
    }

    // const today = new Date().toISOString().slice(0, 10);
    new Date().toISOString().slice(0, 10);

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
      const mappedMethod = paymentMethod === "card" ? "card" : paymentMethod === "netbanking" ? "bank" : paymentMethod === "bank" ? "bank" : "esewa";
      const txData: NewTransaction = {
        id: crypto.randomUUID(),
        type: "online_received",
        amount: String(onlineAmount),
        receivedFrom: `Order #${orderId}`,
        paymentMethod: mappedMethod,
        accountId: accountId || null,
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

    const remainingDue = Math.max(0, Number(payload.dueAmount) || 0);

    if (markAsDue && remainingDue > 0) {
      const [orderRecord] = await db.select().from(orders).where(eq(orders.id, Number(orderId))).limit(1);
      const customerName = duePersonName || orderRecord?.customerName || `Order #${orderId}`;
      const dueData: NewDue = {
        id: crypto.randomUUID(),
        personName: customerName,
        orderId: Number(orderId),
        role: dueRole || "customer",
        totalDue: String(remainingDue),
        paid: "0",
        remaining: String(remainingDue),
        status: "pending",
      };
      await createDue(dueData);
      await updateOrderPaymentStatus(Number(orderId), false, remainingDue.toFixed(2));
    } else if (Number(cashAmount) > 0 || Number(onlineAmount) > 0) {
      await updateOrderPaymentStatus(Number(orderId), remainingDue <= 0, remainingDue.toFixed(2));

      const allDues = await getDues();
      const orderDue = allDues.find(
        (d) => d.orderId === Number(orderId) || (d.personName === `Order #${orderId}` && d.role === "customer") && Number(d.remaining) > 0
      );
      if (orderDue) {
        const paidNow = totalReceived + discountAmount;
        const newPaid = Math.min(Number(orderDue.paid) + paidNow, Number(orderDue.totalDue));
        const newRemaining = Number(orderDue.totalDue) - newPaid;
        const newStatus = newRemaining <= 0 ? "paid" : newPaid > 0 ? "partial" : "pending";
        await updateDue(orderDue.id, {
          paid: String(newPaid),
          remaining: String(newRemaining),
          status: newStatus,
        });
      }

      try {
        await recordCustomerPayment({
          orderId: Number(orderId),
          amount: totalReceived,
          referenceId: `SETTLE-${orderId}-${Date.now()}`,
        });
      } catch (e) {
        console.error("Failed to record customer payment accounting entry", e);
      }
    }

    const overpaymentAmt = Number(overpayment) || 0;
    if (overpaymentAmt > 0) {
      const [orderRecord] = await db.select().from(orders).where(eq(orders.id, Number(orderId))).limit(1);
      if (orderRecord?.userId) {
        const [creditUser] = await db.select().from(users).where(eq(users.id, orderRecord.userId)).limit(1);
        if (creditUser) {
          const currentCredit = Number(creditUser.creditBalance || 0);
          await db.update(users)
            .set({ creditBalance: String(currentCredit + overpaymentAmt) })
            .where(eq(users.id, orderRecord.userId));
        }
      }
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to settle payment", error);
    return NextResponse.json({ error: "Unable to settle payment" }, { status: 500 });
  }
}
