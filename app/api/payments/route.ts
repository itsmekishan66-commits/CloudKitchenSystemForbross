import { NextResponse } from "next/server";

import { getTransactions, createTransaction, getDues, createDue, updateDue } from "@/db/services/payments";
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
            const data: NewTransaction = {
                id: payload.id,
                type: payload.type,
                amount: String(payload.amount),
                receivedFrom: payload.receivedFrom || null,
                paidTo: payload.paidTo || null,
                paymentMethod: payload.paymentMethod,
                transactionId: payload.transactionId || null,
                notes: payload.notes || null,
            };
            await createTransaction(data);
            return NextResponse.json({ ok: true }, { status: 201 });
        }

        if (payload._kind === "due") {
            const data: NewDue = {
                id: payload.id,
                personName: payload.personName,
                role: payload.role,
                totalDue: String(payload.totalDue),
                paid: String(payload.paid || "0"),
                remaining: String(payload.remaining ?? payload.totalDue),
                status: payload.status || "pending",
            };
            await createDue(data);
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
            const { id, paid, remaining, status } = payload;
            await updateDue(id, {
                paid: String(paid),
                remaining: String(remaining),
                status,
            });
            return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ error: "Invalid _kind" }, { status: 400 });
    } catch (error) {
        console.error("Failed to update payment record", error);
        return NextResponse.json({ error: "Unable to update record" }, { status: 500 });
    }
}
