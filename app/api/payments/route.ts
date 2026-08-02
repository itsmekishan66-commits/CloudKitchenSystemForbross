import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { getTransactions, createTransaction, getDues, createDue, updateDue, getDueById, getPaymentAccountById } from "@/db/services/payments";
import { postTransactionEntry, recordCustomerPayment } from "@/db/services/accounting";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { markOrderPaymentSettled } from "@/db/services/orders";
import { getSupplierByName, createSupplierSettlement } from "@/db/services/suppliers";
import type { NewTransaction, NewDue } from "@/db/schemas";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const user = await apiRequirePermissions(PERMISSIONS.VIEW_PAYMENTS);
        if (user instanceof NextResponse) return user;

        const [transactionsList, duesList] = await Promise.all([
            getTransactions(),
            getDues(),
        ]);

        return NextResponse.json({ transactions: transactionsList, dues: duesList });
    } catch (error) {
        console.error("Failed to load payments", error);
        return NextResponse.json({ error: "Unable to load payments" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await apiRequirePermissions(PERMISSIONS.CREATE_PAYMENTS);
        if (user instanceof NextResponse) return user;

        const payload = await request.json();

        if (payload._kind === "transaction") {
            const amount = Number(payload.amount);
            if (!Number.isFinite(amount) || amount <= 0) {
                return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
            }
            const data: NewTransaction = {
                id: payload.id,
                type: payload.type,
                amount: amount.toFixed(2),
                receivedFrom: payload.receivedFrom || null,
                paidTo: payload.paidTo || null,
                paymentMethod: payload.paymentMethod,
                transactionId: payload.transactionId || null,
                notes: payload.notes || null,
            };
            await createTransaction(data);
            await postTransactionEntry({
                id: data.id,
                type: data.type,
                amount: data.amount,
                notes: data.notes,
                paidTo: data.paidTo,
                receivedFrom: data.receivedFrom,
            });
            revalidateTag(CACHE_TAGS.ACCOUNTING_OVERVIEW, "max");
            revalidateTag(CACHE_TAGS.TRIAL_BALANCE, "max");
            revalidateTag(CACHE_TAGS.INCOME_STATEMENT, "max");
            revalidateTag(CACHE_TAGS.BALANCE_SHEET, "max");
            revalidateTag(CACHE_TAGS.CASH_FLOW, "max");
            return NextResponse.json({ ok: true }, { status: 201 });
        }

        if (payload._kind === "due") {
            const totalDue = Number(payload.totalDue);
            const paid = Number(payload.paid || "0");
            const remaining = Number(payload.remaining ?? payload.totalDue);
            if (!Number.isFinite(totalDue) || totalDue < 0) {
                return NextResponse.json({ error: "Invalid total due" }, { status: 400 });
            }
            if (!Number.isFinite(paid) || paid < 0) {
                return NextResponse.json({ error: "Invalid paid amount" }, { status: 400 });
            }
            if (!Number.isFinite(remaining) || remaining < 0) {
                return NextResponse.json({ error: "Invalid remaining amount" }, { status: 400 });
            }
            const data: NewDue = {
                id: payload.id,
                personName: payload.personName,
                role: payload.role,
                totalDue: totalDue.toFixed(2),
                paid: paid.toFixed(2),
                remaining: remaining.toFixed(2),
                status: payload.status || "pending",
            };
            await createDue(data);
            revalidateTag(CACHE_TAGS.ACCOUNTING_OVERVIEW, "max");
            return NextResponse.json({ ok: true }, { status: 201 });
        }

        return NextResponse.json({ error: "Invalid _kind. Must be 'transaction' or 'due'." }, { status: 400 });
    } catch (error) {
        console.error("Failed to create payment record", error);
        return NextResponse.json({ error: "Unable to create record" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const user = await apiRequirePermissions(PERMISSIONS.UPDATE_PAYMENTS);
        if (user instanceof NextResponse) return user;

        const payload = await request.json();

        if (payload._kind === "settle_due") {
            const { id, paid, remaining, status, paymentMethod, accountId, accountName } = payload;
            const existing = await getDueById(id);
            const settledAmount = Number(paid) - Number(existing?.paid || 0);

            await updateDue(id, {
                paid: String(paid),
                remaining: String(remaining),
                status,
            });

            if (status === "paid" && Number(remaining) <= 0 && existing?.orderId) {
                await markOrderPaymentSettled(Number(existing.orderId));
            }

            if (settledAmount > 0) {
                const method = paymentMethod || "cash";
                const isReceived = (existing?.role || "customer") === "customer";
                const type = method === "cash"
                    ? (isReceived ? "cash_received" : "cash_paid")
                    : (isReceived ? "online_received" : "online_paid");

                const account = accountId ? await getPaymentAccountById(accountId) : null;
                const linkedAccountId = account ? account.id : null;
                const accountLabel = accountName || account?.accountName || (method === "cash" ? "Cash" : method);

                let supplierSettlementId: number | null = null;
                if (!isReceived && existing?.personName) {
                    const supplier = await getSupplierByName(existing.personName);
                    if (supplier) {
                        supplierSettlementId = await createSupplierSettlement({
                            supplierId: supplier.id,
                            amount: settledAmount.toFixed(2),
                            type: "payment",
                            paymentMethod: method,
                            transactionId: null,
                            notes: `Payment via Payments section${existing.orderId ? ` (Order #${existing.orderId})` : ""} via ${accountLabel}`,
                        });
                    }
                }

                await createTransaction({
                    id: crypto.randomUUID(),
                    type,
                    amount: String(settledAmount),
                    receivedFrom: isReceived ? (existing?.personName || null) : null,
                    paidTo: isReceived ? null : (existing?.personName || null),
                    paymentMethod: method,
                    accountId: linkedAccountId,
                    transactionId: supplierSettlementId
                        ? `SUPPLIER-SETTLE-${supplierSettlementId}`
                        : (linkedAccountId ? `SETTLE-${linkedAccountId}` : null),
                    notes: `Due settlement${existing?.orderId ? ` (Order #${existing.orderId})` : ""} via ${accountLabel}`,
                });

                if (isReceived && existing?.orderId) {
                    await recordCustomerPayment({
                        orderId: Number(existing.orderId),
                        amount: settledAmount,
                        referenceId: crypto.randomUUID(),
                    });
                }
            }

            revalidateTag(CACHE_TAGS.ACCOUNTING_OVERVIEW, "max");
            revalidateTag(CACHE_TAGS.TRIAL_BALANCE, "max");
            revalidateTag(CACHE_TAGS.INCOME_STATEMENT, "max");
            revalidateTag(CACHE_TAGS.BALANCE_SHEET, "max");
            revalidateTag(CACHE_TAGS.CASH_FLOW, "max");
            return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ error: "Invalid _kind" }, { status: 400 });
    } catch (error) {
        console.error("Failed to update payment record", error);
        return NextResponse.json({ error: "Unable to update record" }, { status: 500 });
    }
}
