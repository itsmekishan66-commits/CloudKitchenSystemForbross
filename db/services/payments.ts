import { db } from "@/db";
import { transactions, dues, type NewTransaction, type NewDue } from "@/db/schemas";
import { desc, eq } from "drizzle-orm";

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
