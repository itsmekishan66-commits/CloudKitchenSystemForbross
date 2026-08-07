import { db } from "@/db";
import { transactions, dues, paymentAccounts, type NewTransaction, type NewDue } from "@/db/schemas";
import { desc, eq, or, and, isNull } from "drizzle-orm";
import { orders } from "@/db/schemas";

type NewPaymentAccount = typeof paymentAccounts.$inferInsert;

export async function getTransactions() {
    return db.select().from(transactions).orderBy(desc(transactions.createdAt));
}

export async function createTransaction(data: NewTransaction) {
    await db.insert(transactions).values(data);
}

export async function getTransactionById(id: string) {
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return tx ?? null;
}

export async function getTransactionByRef(ref: string) {
    const [tx] = await db.select().from(transactions).where(eq(transactions.transactionId, ref)).limit(1);
    return tx ?? null;
}

export async function updateTransaction(id: string, data: Partial<NewTransaction>) {
    await db.update(transactions).set(data).where(eq(transactions.id, id));
}

export async function deleteTransaction(id: string) {
    await db.delete(transactions).where(eq(transactions.id, id));
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

    const RECEIVED = new Set(["cash_received", "online_received"]);
    const PAID = new Set(["cash_paid", "online_paid", "expense", "bank_transfer", "refund"]);

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

export async function getAccountTransactions(accountId: string) {
    const account = await getPaymentAccountById(accountId);
    if (!account) return null;

    // Map payment account method to transaction payment method
    // paymentAccounts method: "esewa" | "khalti" | "netbanking" | "card"
    // transactions paymentMethod: "cash" | "bank" | "esewa" | "khalti" | "fonepay" | "card"
    const methodMap: Record<string, string> = {
      netbanking: "bank",
      esewa: "esewa",
      khalti: "khalti",
      card: "card",
      fonepay: "fonepay",
    };
    const transactionMethod = (methodMap[account.method] || account.method) as "cash" | "bank" | "esewa" | "khalti" | "fonepay" | "card";

    // Get all transactions for this account
    // Match by: accountId OR (accountId is null AND paymentMethod matches)
    const accountTransactions = await db
        .select()
        .from(transactions)
        .where(
            or(
                eq(transactions.accountId, accountId),
                and(
                    isNull(transactions.accountId),
                    eq(transactions.paymentMethod, transactionMethod)
                )
            )
        )
        .orderBy(desc(transactions.createdAt));

    // Enrich transactions with customer/supplier names from orders and dues
    // Look for transactions with receivedFrom/paidTo like "Order #123"
    const enrichedTransactions = await Promise.all(
        accountTransactions.map(async (tx) => {
            // Check if this is an order-related transaction
            const orderMatch = tx.receivedFrom?.match(/^Order #(\d+)$/) || tx.paidTo?.match(/^Order #(\d+)$/);
            if (orderMatch) {
                const orderId = parseInt(orderMatch[1], 10);
                const [order] = await db
                    .select({ customerName: orders.customerName })
                    .from(orders)
                    .where(eq(orders.id, orderId))
                    .limit(1);
                
                if (order) {
                    const isReceived = tx.receivedFrom?.startsWith("Order #");
                    const role = isReceived ? "Customer" : "Supplier";
                    // Return enriched transaction with customer name + order number + role
                    return {
                        ...tx,
                        enrichedPerson: `${order.customerName} (Order #${orderId} - ${role})`,
                    };
                }
            }
            
            // For other transactions, use receivedFrom or paidTo as-is
            // But also try to enrich due settlement transactions
            // A due settlement is identified by its transactionId prefix
            // (SUPPLIER-SETTLE-* for suppliers, SETTLE-* for customer/supplier dues)
            // or by notes mentioning a due settlement
            const txId = tx.transactionId || "";
            const isSupplierSettlement = txId.startsWith("SUPPLIER-SETTLE-");
            const isDueSettlement =
                isSupplierSettlement ||
                txId.startsWith("SETTLE-") ||
                Boolean(tx.notes?.includes("Due settlement"));
            if (isDueSettlement) {
                const isReceived = tx.type === "cash_received" || tx.type === "online_received";
                const role = isSupplierSettlement ? "Supplier" : isReceived ? "Customer" : "Supplier";
                const personName = isReceived ? tx.receivedFrom : tx.paidTo;
                if (personName) {
                    return {
                        ...tx,
                        enrichedPerson: `${personName} (Due - ${role})`,
                    };
                }
            }
            
            return {
                ...tx,
                enrichedPerson: tx.receivedFrom || tx.paidTo || null,
            };
        })
    );

    // Calculate totals
    const RECEIVED = new Set(["cash_received", "online_received"]);
    const PAID = new Set(["cash_paid", "online_paid", "expense", "bank_transfer", "refund"]);

    let totalReceived = 0;
    let totalPaid = 0;

    for (const tx of accountTransactions) {
        const amt = Number(tx.amount) || 0;
        if (RECEIVED.has(tx.type)) totalReceived += amt;
        else if (PAID.has(tx.type)) totalPaid += amt;
    }

    const opening = Number(account.openingBalance || 0);
    const closingBalance = opening + totalReceived - totalPaid;

    return {
        account: {
            ...account,
            totalReceived,
            totalPaid,
            closingBalance,
        },
        transactions: enrichedTransactions,
    };
}
