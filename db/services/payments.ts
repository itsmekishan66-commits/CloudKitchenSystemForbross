import { db } from "@/db";
import { transactions, dues, paymentAccounts, type NewTransaction, type NewDue } from "@/db/schemas";
import { desc, eq } from "drizzle-orm";

type NewPaymentAccount = typeof paymentAccounts.$inferInsert;

export async function getTransactions() {
    return db.select().from(transactions).orderBy(desc(transactions.createdAt));
}

export async function createTransaction(data: NewTransaction) {
    await db.insert(transactions).values(data);
}

export async function getDues() {
    return db.select().from(dues).orderBy(desc(dues.createdAt));
}

export async function getDueById(id: string) {
    const [due] = await db.select().from(dues).where(eq(dues.id, id)).limit(1);
    return due || null;
}

export async function createDue(data: NewDue) {
    await db.insert(dues).values(data);
}

export async function updateDue(id: string, data: Partial<NewDue>) {
    await db.update(dues).set(data).where(eq(dues.id, id));
}

export async function getPaymentAccounts() {
    return db.select().from(paymentAccounts).orderBy(desc(paymentAccounts.createdAt));
}

export async function getPaymentAccountById(id: string) {
    const [account] = await db.select().from(paymentAccounts).where(eq(paymentAccounts.id, id)).limit(1);
    return account || null;
}

export async function createPaymentAccount(data: NewPaymentAccount) {
    await db.insert(paymentAccounts).values(data);
}

export async function updatePaymentAccount(id: string, data: Partial<NewPaymentAccount>) {
    await db.update(paymentAccounts).set(data).where(eq(paymentAccounts.id, id));
}

export async function deletePaymentAccount(id: string) {
    await db.delete(paymentAccounts).where(eq(paymentAccounts.id, id));
}

export async function getAccountBalances() {
    const accounts = await db.select().from(paymentAccounts).orderBy(desc(paymentAccounts.createdAt));

    // Fetch all transactions once, then compute per-account totals in memory (avoids N+1)
    const allTx = await db
        .select({
            accountId: transactions.accountId,
            paymentMethod: transactions.paymentMethod,
            type: transactions.type,
            amount: transactions.amount,
        })
        .from(transactions);

    const RECEIVED = new Set(["cash_received", "online_received", "refund"]);
    const PAID = new Set(["cash_paid", "online_paid", "expense", "bank_transfer"]);

    return accounts.map((account) => {
        let totalReceived = 0;
        let totalPaid = 0;

        for (const tx of allTx) {
            const matches =
                tx.accountId === account.id ||
                (tx.accountId == null && tx.paymentMethod === account.method);
            if (!matches) continue;

            const amt = Number(tx.amount) || 0;
            if (RECEIVED.has(tx.type)) totalReceived += amt;
            else if (PAID.has(tx.type)) totalPaid += amt;
        }

        const opening = Number(account.openingBalance || 0);
        const closingBalance = opening + totalReceived - totalPaid;

        return {
            ...account,
            totalReceived,
            totalPaid,
            closingBalance,
        };
    });
}
