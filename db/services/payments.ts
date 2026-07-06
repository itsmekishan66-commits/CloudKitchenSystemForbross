import { db } from "@/db";
import { transactions, dues, paymentAccounts, type NewTransaction, type NewDue } from "@/db/schemas";
import { desc, eq, sql } from "drizzle-orm";

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

    const balances = await Promise.all(
        accounts.map(async (account) => {
            const [received] = await db
                .select({ total: sql<string>`coalesce(sum(${transactions.amount}), 0)` })
                .from(transactions)
                .where(sql`${transactions.accountId} = ${account.id} and ${transactions.type} in ('cash_received', 'online_received', 'refund')`);

            const [paid] = await db
                .select({ total: sql<string>`coalesce(sum(${transactions.amount}), 0)` })
                .from(transactions)
                .where(sql`${transactions.accountId} = ${account.id} and ${transactions.type} in ('cash_paid', 'online_paid', 'expense', 'bank_transfer')`);

            const opening = Number(account.openingBalance || 0);
            const totalReceived = Number(received?.total || 0);
            const totalPaid = Number(paid?.total || 0);
            const closingBalance = opening + totalReceived - totalPaid;

            return {
                ...account,
                totalReceived,
                totalPaid,
                closingBalance,
            };
        })
    );

    return balances;
}
