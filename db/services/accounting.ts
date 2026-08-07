import { createTransaction, getTransactionByRef } from "@/db/services/payments";
import { eq, and, sql, desc, asc, gte, lte, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  chartOfAccounts,
  journalEntries,
  journalEntryLines,
  accountBalances,
  supplierProducts,
  suppliers,
  supplierSettlements,
  recipes,
  recipeIngredients,
  inventoryItems,
  transactions,
  type NewChartOfAccount,
} from "@/db/schemas";

// A db client that is either the shared pool or a transaction handle. Passing
// the transaction handle keeps multi-step journal operations atomic.
type DbClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];


export async function getChartOfAccounts() {
  return db
    .select()
    .from(chartOfAccounts)
    .orderBy(asc(chartOfAccounts.code));
}

export async function getActiveAccounts() {
  return db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.isActive, true))
    .orderBy(asc(chartOfAccounts.code));
}

// Chart of accounts enriched with the current cumulative balance of each account.
export async function getAccountsWithBalances() {
  const accounts = await getChartOfAccounts();
  const balanceMap = await getAccountBalanceMap(
    "1900-01-01",
    new Date().toISOString().substring(0, 10)
  );
  return accounts.map((a) => ({
    ...a,
    balance: String(balanceMap.get(a.id) ?? 0),
  }));
}

export async function getAccountById(id: string) {
  const result = await db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.id, id))
    .limit(1);
  return result[0] || null;
}

export async function getAccountByCode(code: string) {
  const result = await db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.code, code))
    .limit(1);
  return result[0] || null;
}

export async function createAccount(data: {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  subType:
    | "current_asset"
    | "fixed_asset"
    | "current_liability"
    | "long_term_liability"
    | "equity"
    | "revenue"
    | "cogs"
    | "operating_expense"
    | "non_operating_expense";
  description?: string;
  parentId?: string;
  openingBalance?: string;
}) {
  await db.insert(chartOfAccounts).values({
    id: data.id,
    code: data.code,
    name: data.name,
    type: data.type,
    subType: data.subType,
    description: data.description,
    parentId: data.parentId,
    openingBalance: data.openingBalance || "0",
  });
  await upsertOpeningBalance(data.id, data.openingBalance, data.type);
  return getAccountById(data.id);
}

export async function updateAccount(
  id: string,
  data: Partial<{
    code: string;
    name: string;
    type: string;
    subType: string;
    description: string;
    parentId: string;
    isActive: boolean;
    openingBalance: string;
  }>
) {
  const VALID_TYPES = ["asset", "liability", "equity", "revenue", "expense"];
  const VALID_SUBTYPES = [
    "current_asset",
    "fixed_asset",
    "current_liability",
    "long_term_liability",
    "revenue",
    "cogs",
    "operating_expense",
    "non_operating_expense",
    "equity",
  ];

  if (data.type !== undefined && !VALID_TYPES.includes(data.type)) {
    throw new Error(`Invalid account type: ${data.type}`);
  }
  if (data.subType !== undefined && !VALID_SUBTYPES.includes(data.subType)) {
    throw new Error(`Invalid account subType: ${data.subType}`);
  }

  await db
    .update(chartOfAccounts)
    .set({ ...data, updatedAt: new Date() } as NewChartOfAccount)
    .where(eq(chartOfAccounts.id, id));

  if (data.openingBalance !== undefined || data.type !== undefined) {
    const account = await getAccountById(id);
    if (account) {
      await upsertOpeningBalance(
        id,
        data.openingBalance ?? account.openingBalance,
        (data.type as string) ?? account.type
      );
    }
  }

  return getAccountById(id);
}

export async function deleteAccount(id: string) {
  const [entryLines, accountBalancesRefs, childAccounts] = await Promise.all([
    db
      .select({ id: journalEntryLines.id })
      .from(journalEntryLines)
      .where(eq(journalEntryLines.accountId, id))
      .limit(1),
    db
      .select({ id: accountBalances.id })
      .from(accountBalances)
      .where(eq(accountBalances.accountId, id))
      .limit(1),
    db
      .select({ id: chartOfAccounts.id })
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.parentId, id))
      .limit(1),
  ]);

  if (entryLines.length > 0) {
    throw new Error(
      "This account cannot be deleted because it has journal entry transactions."
    );
  }
  if (accountBalancesRefs.length > 0) {
    throw new Error(
      "This account cannot be deleted because it has recorded balances."
    );
  }
  if (childAccounts.length > 0) {
    throw new Error(
      "This account cannot be deleted because it has sub-accounts linked to it."
    );
  }

  await db.delete(chartOfAccounts).where(eq(chartOfAccounts.id, id));
}

export async function getAccountsByType(
  type: "asset" | "liability" | "equity" | "revenue" | "expense"
) {
  return db
    .select()
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.type, type), eq(chartOfAccounts.isActive, true)))
    .orderBy(asc(chartOfAccounts.code));
}

// Journal Entries

// Computes the next sequential entry number for the current year using a
// locking read. It MUST be called inside the same transaction that inserts the
// entry so the lock is held until the row is committed, preventing concurrent
// inserts from colliding on the unique entry_number.
async function nextEntryNumber(client: DbClient): Promise<string> {
  const year = new Date().getFullYear();
  await client.execute(
    sql`SELECT id FROM journal_entries WHERE year(date) = ${year} FOR UPDATE`
  );
  const result = await client
    .select({ count: sql<number>`count(*)` })
    .from(journalEntries)
    .where(sql`year(${journalEntries.date}) = ${year}`);
  const seq = (result[0]?.count || 0) + 1;
  return `JE-${year}-${String(seq).padStart(4, "0")}`;
}

export async function generateEntryNumber(): Promise<string> {
  return db.transaction((tx) => nextEntryNumber(tx));
}

export async function getJournalEntries(filters?: {
  status?: "draft" | "posted" | "voided";
  startDate?: string;
  endDate?: string;
  accountId?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(journalEntries.status, filters.status));
  }
  if (filters?.startDate) {
    conditions.push(gte(journalEntries.date, new Date(filters.startDate)));
  }
  if (filters?.endDate) {
    conditions.push(lte(journalEntries.date, new Date(filters.endDate)));
  }
  if (filters?.accountId) {
    const lineRows = await db
      .select({ journalEntryId: journalEntryLines.journalEntryId })
      .from(journalEntryLines)
      .where(eq(journalEntryLines.accountId, filters.accountId));
    conditions.push(
      inArray(
        journalEntries.id,
        lineRows.map((r) => r.journalEntryId)
      )
    );
  }

  const where =
    conditions.length > 0 ? and(...conditions) : undefined;

  const entries = await db
    .select()
    .from(journalEntries)
    .where(where)
    .orderBy(desc(journalEntries.date), desc(journalEntries.createdAt))
    .limit(filters?.limit || 100)
    .offset(filters?.offset || 0);

  return entries;
}

export async function getJournalEntryById(id: string) {
  const entry = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.id, id))
    .limit(1);
  if (!entry[0]) return null;

  const lines = await db
    .select()
    .from(journalEntryLines)
    .where(eq(journalEntryLines.journalEntryId, id))
    .orderBy(asc(journalEntryLines.createdAt));

  return { ...entry[0], lines };
}

export async function createJournalEntry(data: {
  id: string;
  date: string;
  description: string;
  referenceType?: string;
  referenceId?: string;
  createdBy?: number;
  lines: {
    id: string;
    accountId: string;
    debit: string;
    credit: string;
    description?: string;
  }[];
}) {
  const totalDebit = data.lines.reduce(
    (sum, line) => sum + Number(line.debit),
    0
  );
  const totalCredit = data.lines.reduce(
    (sum, line) => sum + Number(line.credit),
    0
  );

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(
      `Debit (${totalDebit}) and Credit (${totalCredit}) must be equal`
    );
  }

  if (totalDebit === 0 || totalCredit === 0) {
    throw new Error("Debit and Credit amounts must be greater than zero");
  }

  // Header + lines are inserted in one transaction so a failure cannot leave an
  // orphan entry or lines without a header. The entry number is allocated with a
  // locking read inside the same transaction to stay collision-free.
  await db.transaction(async (tx) => {
    const entryNumber = await nextEntryNumber(tx);
    await tx.insert(journalEntries).values({
      id: data.id,
      entryNumber,
      date: new Date(data.date),
      description: data.description,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      status: "draft",
      totalDebit: String(totalDebit),
      totalCredit: String(totalCredit),
      createdBy: data.createdBy,
    });

    for (const line of data.lines) {
      await tx.insert(journalEntryLines).values({
        id: line.id,
        journalEntryId: data.id,
        accountId: line.accountId,
        debit: line.debit || "0",
        credit: line.credit || "0",
        description: line.description,
      });
    }
  });

  return getJournalEntryById(data.id);
}

export async function postJournalEntry(id: string) {
  const entry = await getJournalEntryById(id);
  if (!entry) throw new Error("Journal entry not found");
  if (entry.status === "posted")
    throw new Error("Journal entry is already posted");
  if (entry.status === "voided")
    throw new Error("Cannot post a voided journal entry");

  // Status flip and balance application are committed atomically: a failure
  // cannot leave the entry posted without its balances applied.
  await db.transaction(async (tx) => {
    await tx
      .update(journalEntries)
      .set({ status: "posted", updatedAt: new Date() })
      .where(eq(journalEntries.id, id));

    await updateAccountBalances(entry, tx);
  });

  return getJournalEntryById(id);
}

export async function voidJournalEntry(id: string, reason: string) {
  const entry = await getJournalEntryById(id);
  if (!entry) throw new Error("Journal entry not found");
  if (entry.status === "voided")
    throw new Error("Journal entry is already voided");

  // Status flip, balance reversal and the /payment reversal transaction all
  // commit (or roll back) together so the ledger and /payment never diverge.
  await db.transaction(async (tx) => {
    await tx
      .update(journalEntries)
      .set({
        status: "voided",
        voidReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(journalEntries.id, id));

    if (entry.status === "posted") {
      await reverseAccountBalances(entry, tx);
    }

    await reverseLinkedPaymentTransaction(entry, reason, tx);
  });

  return getJournalEntryById(id);
}

type PaymentTxType =
  | "cash_received"
  | "cash_paid"
  | "online_received"
  | "online_paid"
  | "expense"
  | "bank_transfer"
  | "refund";

type PaymentMethod = "cash" | "bank" | "esewa" | "khalti" | "fonepay" | "card";

const REVERSAL_TYPE: Record<PaymentTxType, PaymentTxType> = {
  cash_received: "cash_paid",
  cash_paid: "cash_received",
  online_received: "online_paid",
  online_paid: "online_received",
  expense: "cash_received",
  bank_transfer: "cash_received",
  refund: "cash_received",
};

// Inserts an opposite-side transaction in /payment so the voided amount is
// deducted (or restored) in the same balance bucket, keeping /payment in sync
// with the voided journal entry. No journal entry is created for the reversal
// itself, mirroring the initial-investment void convention.
async function reverseLinkedPaymentTransaction(
  entry: {
    id: string;
    entryNumber: string;
    referenceType: string | null;
    referenceId: string | null;
    lines?: { accountId: string; debit: string; credit: string }[];
  },
  reason: string,
  client: DbClient = db
) {
  const refType = entry.referenceType || "";
  const isOrderPayment = refType === "order_payment";

  let linkedTx: {
    type: PaymentTxType;
    amount: string;
    paymentMethod: PaymentMethod;
    receivedFrom: string | null;
    paidTo: string | null;
    accountId: string | null;
  } | null = null;

  if (isOrderPayment) {
    // Customer-payment entries book Debit Cash/Bank, Credit Receivable. The
    // original /payment receipt still exists, so on void we insert a matching
    // deduction in the same balance bucket, returning /payment to zero.
    const lines = entry.lines || [];
    const fundLine = lines.find(
      (l) => l.accountId === "1000" || l.accountId === "1010"
    );
    if (fundLine) {
      const isBank = fundLine.accountId === "1010";
      linkedTx = {
        type: isBank ? "online_paid" : "cash_paid",
        amount: String(Number(fundLine.debit || fundLine.credit) || 0),
        paymentMethod: isBank ? "bank" : "cash",
        receivedFrom: null,
        paidTo: null,
        accountId: null,
      };
    }
  } else if (refType === INITIAL_INVESTMENT_REF) {
    const [row] = await client
      .select()
      .from(transactions)
      .where(eq(transactions.transactionId, `${INITIAL_INVESTMENT_REF}-${entry.id}`))
      .limit(1);
    if (row) {
      linkedTx = {
        type: row.type as PaymentTxType,
        amount: row.amount,
        paymentMethod: row.paymentMethod as PaymentMethod,
        receivedFrom: row.receivedFrom,
        paidTo: row.paidTo,
        accountId: row.accountId,
      };
    }
  } else if (refType.startsWith("payment_")) {
    const [row] = await client
      .select()
      .from(transactions)
      .where(eq(transactions.id, entry.referenceId || ""))
      .limit(1);
    if (row) {
      linkedTx = {
        type: row.type as PaymentTxType,
        amount: row.amount,
        paymentMethod: row.paymentMethod as PaymentMethod,
        receivedFrom: row.receivedFrom,
        paidTo: row.paidTo,
        accountId: row.accountId,
      };
    }
  } else if (refType.startsWith("supplier_")) {
    const [row] = await client
      .select()
      .from(transactions)
      .where(eq(transactions.transactionId, `SUPPLIER-SETTLE-${entry.referenceId}`))
      .limit(1);
    if (row) {
      linkedTx = {
        type: row.type as PaymentTxType,
        amount: row.amount,
        paymentMethod: row.paymentMethod as PaymentMethod,
        receivedFrom: row.receivedFrom,
        paidTo: row.paidTo,
        accountId: row.accountId,
      };
    }
  }

  if (!linkedTx) return;

  let type: PaymentTxType;
  if (isOrderPayment) {
    // linkedTx already carries the desired deduction direction for customer
    // payments; do not map it again through REVERSAL_TYPE.
    type = linkedTx.type;
  } else {
    type = REVERSAL_TYPE[linkedTx.type];
    if (linkedTx.type === "refund") {
      type =
        linkedTx.paymentMethod === "cash" ? "cash_received" : "online_received";
    }
  }

  const isReceived = type.endsWith("received");
  const fallbackParty = `Void of ${entry.entryNumber}`;

  await client.insert(transactions).values({
    id: crypto.randomUUID(),
    type,
    amount: linkedTx.amount,
    receivedFrom: isReceived ? linkedTx.paidTo || fallbackParty : null,
    paidTo: isReceived ? null : linkedTx.receivedFrom || fallbackParty,
    paymentMethod: linkedTx.paymentMethod,
    accountId: linkedTx.accountId,
    transactionId: `VOID-${entry.entryNumber}`,
    notes: `Reversal of ${linkedTx.type} ${linkedTx.amount} - ${entry.entryNumber} (${reason})`,
  });
}

// Account Balances

async function updateAccountBalances(
  entry: {
    lines: { accountId: string; debit: string; credit: string }[];
    date: Date;
  },
  client: DbClient = db
) {
  const period = entry.date.toISOString().substring(0, 7);
  const accountIds = entry.lines.map((l) => l.accountId);

  // Batch-fetch existing balances and accounts once (avoids per-line N+1)
  const existingRows =
    accountIds.length > 0
      ? await client
          .select()
          .from(accountBalances)
          .where(
            and(
              inArray(accountBalances.accountId, accountIds),
              eq(accountBalances.period, period)
            )
          )
      : [];
  const existingByAccount = new Map(existingRows.map((r) => [r.accountId, r]));

  const accounts = await client.select().from(chartOfAccounts);
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  for (const line of entry.lines) {
    const existing = existingByAccount.get(line.accountId);
    const debit = Number(line.debit);
    const credit = Number(line.credit);

    const account = accountMap.get(line.accountId);
    const isDebitNormal =
      account?.type === "asset" || account?.type === "expense";

    if (existing) {
      const newDebitTotal = Number(existing.debitTotal) + debit;
      const newCreditTotal = Number(existing.creditTotal) + credit;
      const newBalance = isDebitNormal
        ? newDebitTotal - newCreditTotal
        : newCreditTotal - newDebitTotal;

      await client
        .update(accountBalances)
        .set({
          debitTotal: String(newDebitTotal),
          creditTotal: String(newCreditTotal),
          balance: String(newBalance),
          updatedAt: new Date(),
        })
        .where(eq(accountBalances.id, existing.id));
    } else {
      const balance = isDebitNormal ? debit - credit : credit - debit;

      await client.insert(accountBalances).values({
        id: crypto.randomUUID(),
        accountId: line.accountId,
        period,
        debitTotal: String(debit),
        creditTotal: String(credit),
        balance: String(balance),
      });
    }
  }
}

async function reverseAccountBalances(
  entry: {
    lines: { accountId: string; debit: string; credit: string }[];
    date: Date;
  },
  client: DbClient = db
) {
  const period = entry.date.toISOString().substring(0, 7);
  const accountIds = entry.lines.map((l) => l.accountId);

  const existingRows =
    accountIds.length > 0
      ? await client
          .select()
          .from(accountBalances)
          .where(
            and(
              inArray(accountBalances.accountId, accountIds),
              eq(accountBalances.period, period)
            )
          )
      : [];
  const existingByAccount = new Map(existingRows.map((r) => [r.accountId, r]));

  const accounts = await client.select().from(chartOfAccounts);
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  for (const line of entry.lines) {
    const existing = existingByAccount.get(line.accountId);
    if (existing) {
      const debit = Number(line.debit);
      const credit = Number(line.credit);
      const newDebitTotal = Math.max(0, Number(existing.debitTotal) - debit);
      const newCreditTotal = Math.max(
        0,
        Number(existing.creditTotal) - credit
      );
      const account = accountMap.get(line.accountId);
      const isDebitNormal =
        account?.type === "asset" || account?.type === "expense";
      const newBalance = isDebitNormal
        ? newDebitTotal - newCreditTotal
        : newCreditTotal - newDebitTotal;

      await client
        .update(accountBalances)
        .set({
          debitTotal: String(newDebitTotal),
          creditTotal: String(newCreditTotal),
          balance: String(newBalance),
          updatedAt: new Date(),
        })
        .where(eq(accountBalances.id, existing.id));
    }
  }
}

const INCEPTION_PERIOD = "1900-01";

async function upsertOpeningBalance(
  accountId: string,
  openingBalance: string | number | undefined,
  type: string,
  existing?: typeof accountBalances.$inferSelect | undefined
) {
  const ob = Number(openingBalance || 0);
  const isDebitNormal = type === "asset" || type === "expense";

  const row =
    existing ??
    (
      await db
        .select()
        .from(accountBalances)
        .where(
          and(
            eq(accountBalances.accountId, accountId),
            eq(accountBalances.period, INCEPTION_PERIOD)
          )
        )
        .limit(1)
    )[0];

  if (ob === 0) {
    if (row) {
      await db
        .delete(accountBalances)
        .where(eq(accountBalances.id, row.id));
    }
    return;
  }

  let debitTotal = "0";
  let creditTotal = "0";
  if (isDebitNormal) {
    if (ob >= 0) debitTotal = String(ob);
    else creditTotal = String(-ob);
  } else {
    if (ob >= 0) creditTotal = String(ob);
    else debitTotal = String(-ob);
  }

  if (row) {
    await db
      .update(accountBalances)
      .set({
        debitTotal,
        creditTotal,
        balance: String(ob),
        updatedAt: new Date(),
      })
      .where(eq(accountBalances.id, row.id));
  } else {
    await db.insert(accountBalances).values({
      id: crypto.randomUUID(),
      accountId,
      period: INCEPTION_PERIOD,
      debitTotal,
      creditTotal,
      balance: String(ob),
    });
  }
}

export async function backfillOpeningBalances() {
  const accounts = await db.select().from(chartOfAccounts);

  // Batch-fetch existing inception balances once (avoids per-account N+1)
  const existingRows = await db
    .select()
    .from(accountBalances)
    .where(eq(accountBalances.period, INCEPTION_PERIOD));
  const existingByAccount = new Map(existingRows.map((r) => [r.accountId, r]));

  for (const account of accounts) {
    await upsertOpeningBalance(
      account.id,
      account.openingBalance,
      account.type,
      existingByAccount.get(account.id)
    );
  }
  return accounts.length;
}

export async function getAccountBalance(
  accountId: string,
  asOfPeriod?: string
) {
  const period = asOfPeriod || new Date().toISOString().substring(0, 7);
  const result = await db
    .select()
    .from(accountBalances)
    .where(
      and(
        eq(accountBalances.accountId, accountId),
        lte(accountBalances.period, period)
      )
    )
    .orderBy(desc(accountBalances.period))
    .limit(1);

  return result[0]?.balance || "0";
}

export async function getAccountLedger(
  accountId: string,
  startDate?: string,
  endDate?: string
) {
  const conditions = [eq(journalEntryLines.accountId, accountId)];
  if (startDate) {
    conditions.push(gte(journalEntries.date, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(journalEntries.date, new Date(endDate)));
  }

  const lines = await db
    .select({
      id: journalEntryLines.id,
      date: journalEntries.date,
      entryNumber: journalEntries.entryNumber,
      description: journalEntryLines.description,
      referenceType: journalEntries.referenceType,
      referenceId: journalEntries.referenceId,
      debit: journalEntryLines.debit,
      credit: journalEntryLines.credit,
      status: journalEntries.status,
    })
    .from(journalEntryLines)
    .innerJoin(
      journalEntries,
      eq(journalEntryLines.journalEntryId, journalEntries.id)
    )
    .where(and(...conditions))
    .orderBy(asc(journalEntries.date), asc(journalEntryLines.createdAt));

  let runningBalance = 0;
  const account = await getAccountById(accountId);
  const isDebitNormal =
    account?.type === "asset" || account?.type === "expense";

  return lines.map((line) => {
    const debit = Number(line.debit);
    const credit = Number(line.credit);
    if (isDebitNormal) {
      runningBalance += debit - credit;
    } else {
      runningBalance += credit - debit;
    }
    return { ...line, runningBalance: String(runningBalance) };
  });
}

// Financial Statements

export async function getIncomeStatement(
  startDate: string,
  endDate: string
) {
  const revenueAccounts = await getAccountsByType("revenue");
  const expenseAccounts = await getAccountsByType("expense");

  const balanceMap = await getAccountBalanceMap(startDate, endDate);

  const revenue: { id: string; account: string; amount: number }[] = [];
  let totalRevenue = 0;

  for (const account of revenueAccounts) {
    const amount = Number(balanceMap.get(account.id) ?? 0);
    if (amount !== 0) {
      revenue.push({ id: account.id, account: account.name, amount });
      totalRevenue += amount;
    }
  }

  const cogs: { id: string; account: string; amount: number }[] = [];
  let totalCogs = 0;
  const operatingExpenses: { id: string; account: string; amount: number }[] = [];
  let totalOperatingExpenses = 0;
  const nonOperatingExpenses: { id: string; account: string; amount: number }[] = [];
  let totalNonOperatingExpenses = 0;

  for (const account of expenseAccounts) {
    const amount = Math.abs(Number(balanceMap.get(account.id) ?? 0));
    if (amount !== 0) {
      if (account.subType === "cogs") {
        cogs.push({ id: account.id, account: account.name, amount });
        totalCogs += amount;
      } else if (account.subType === "operating_expense") {
        operatingExpenses.push({ id: account.id, account: account.name, amount });
        totalOperatingExpenses += amount;
      } else {
        nonOperatingExpenses.push({ id: account.id, account: account.name, amount });
        totalNonOperatingExpenses += amount;
      }
    }
  }

  const grossProfit = totalRevenue - totalCogs;
  const operatingIncome = grossProfit - totalOperatingExpenses;
  const netIncome = operatingIncome - totalNonOperatingExpenses;

  return {
    period: { startDate, endDate },
    revenue: { items: revenue, total: totalRevenue },
    cogs: { items: cogs, total: totalCogs },
    grossProfit,
    operatingExpenses: {
      items: operatingExpenses,
      total: totalOperatingExpenses,
    },
    operatingIncome,
    nonOperatingExpenses: {
      items: nonOperatingExpenses,
      total: totalNonOperatingExpenses,
    },
    netIncome,
  };
}

export async function getCashFlowStatement(
  startDate: string,
  endDate: string
) {
  const postedEntries = await db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.status, "posted"),
        gte(journalEntries.date, new Date(startDate)),
        lte(journalEntries.date, new Date(endDate))
      )
    );

  let operatingInflow = 0;
  let operatingOutflow = 0;
  let investingInflow = 0;
  let investingOutflow = 0;
  let financingInflow = 0;
  let financingOutflow = 0;

  // Batch all journal entry lines in one query, then group by entry (avoids N+1)
  const entryIds = postedEntries.map((e) => e.id);
  const allLines =
    entryIds.length > 0
      ? await db
          .select({
            journalEntryId: journalEntryLines.journalEntryId,
            accountId: journalEntryLines.accountId,
            debit: journalEntryLines.debit,
            credit: journalEntryLines.credit,
          })
          .from(journalEntryLines)
          .where(inArray(journalEntryLines.journalEntryId, entryIds))
      : [];
  const linesByEntry = new Map<string, (typeof allLines)[number][]>();
  for (const line of allLines) {
    const list = linesByEntry.get(line.journalEntryId) ?? [];
    list.push(line);
    linesByEntry.set(line.journalEntryId, list);
  }

  // Fetch all accounts once (avoids per-line getAccountById)
  const accounts = await getChartOfAccounts();
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  for (const entry of postedEntries) {
    const lines = linesByEntry.get(entry.id) ?? [];

    for (const line of lines) {
      const account = accountMap.get(line.accountId);
      if (!account) continue;

      const credit = Number(line.credit);
      const debit = Number(line.debit);

      if (account.type === "revenue") {
        operatingInflow += credit;
        // A refund is booked as a debit to revenue (credit to Cash/Bank), so
        // count it as an operating outflow rather than silently ignoring it.
        if (debit > 0) operatingOutflow += debit;
      } else if (account.subType === "cogs") {
        operatingOutflow += debit;
      } else if (account.subType === "operating_expense") {
        operatingOutflow += debit;
      } else if (account.subType === "fixed_asset") {
        if (debit > 0) investingOutflow += debit;
        if (credit > 0) investingInflow += credit;
      } else if (
        account.type === "liability" &&
        account.subType === "long_term_liability"
      ) {
        if (credit > 0) financingInflow += credit;
        if (debit > 0) financingOutflow += debit;
      } else if (account.type === "equity") {
        if (credit > 0) financingInflow += credit;
        if (debit > 0) financingOutflow += debit;
      }
    }
  }

  const netOperating = operatingInflow - operatingOutflow;
  const netInvesting = investingInflow - investingOutflow;
  const netFinancing = financingInflow - financingOutflow;
  const netChange = netOperating + netInvesting + netFinancing;

  return {
    period: { startDate, endDate },
    operating: {
      inflow: operatingInflow,
      outflow: operatingOutflow,
      net: netOperating,
    },
    investing: {
      inflow: investingInflow,
      outflow: investingOutflow,
      net: netInvesting,
    },
    financing: {
      inflow: financingInflow,
      outflow: financingOutflow,
      net: netFinancing,
    },
    netChange,
  };
}

export async function getBalanceSheet(asOfDate: string) {
  const assetAccounts = await getAccountsByType("asset");
  const liabilityAccounts = await getAccountsByType("liability");
  const equityAccounts = await getAccountsByType("equity");

  // Single cumulative balance map covers the whole position up to asOfDate
  // (avoids per-account N+1). Position statements must use cumulative balances.
  const cumulativeMap = await getAccountBalanceMap("1900-01-01", asOfDate);

  const assets: {
    category: string;
    accounts: { id: string; name: string; balance: number }[];
    total: number;
  }[] = [];
  let totalAssets = 0;

  const assetCategories = [
    { subType: "current_asset", label: "Current Assets" },
    { subType: "fixed_asset", label: "Fixed Assets" },
  ];

  for (const cat of assetCategories) {
    const accounts = assetAccounts.filter(
      (a) => a.subType === cat.subType && a.isActive
    );
    const items: { id: string; name: string; balance: number }[] = [];
    let catTotal = 0;

    for (const account of accounts) {
      const balance = Number(cumulativeMap.get(account.id) ?? 0);
      if (balance !== 0) {
        items.push({ id: account.id, name: account.name, balance });
        catTotal += balance;
      }
    }

    if (items.length > 0) {
      assets.push({ category: cat.label, accounts: items, total: catTotal });
      totalAssets += catTotal;
    }
  }

  const liabilities: {
    category: string;
    accounts: { id: string; name: string; balance: number }[];
    total: number;
  }[] = [];
  let totalLiabilities = 0;

  const liabilityCategories = [
    { subType: "current_liability", label: "Current Liabilities" },
    { subType: "long_term_liability", label: "Long-term Liabilities" },
  ];

  for (const cat of liabilityCategories) {
    const accounts = liabilityAccounts.filter(
      (a) => a.subType === cat.subType && a.isActive
    );
    const items: { id: string; name: string; balance: number }[] = [];
    let catTotal = 0;

    for (const account of accounts) {
      const balance = Math.abs(Number(cumulativeMap.get(account.id) ?? 0));
      if (balance !== 0) {
        items.push({ id: account.id, name: account.name, balance });
        catTotal += balance;
      }
    }

    if (items.length > 0) {
      liabilities.push({
        category: cat.label,
        accounts: items,
        total: catTotal,
      });
      totalLiabilities += catTotal;
    }
  }

  const equity: { id: string; name: string; balance: number }[] = [];
  let totalEquity = 0;

  for (const account of equityAccounts) {
    if (!account.isActive) continue;
    const balance = Math.abs(Number(cumulativeMap.get(account.id) ?? 0));
    if (balance !== 0) {
      equity.push({ id: account.id, name: account.name, balance });
      totalEquity += balance;
    }
  }

  const netIncome = await getNetIncomeForPeriod("1900-01-01", asOfDate);
  if (netIncome !== 0) {
    equity.push({ id: "", name: "Retained Earnings (Current Period)", balance: netIncome });
    totalEquity += netIncome;
  }

  return {
    asOfDate,
    assets: { categories: assets, total: totalAssets },
    liabilities: { categories: liabilities, total: totalLiabilities },
    equity: { accounts: equity, total: totalEquity },
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
  };
}

export async function getTrialBalance(asOfDate: string) {
  const accounts = await getActiveAccounts();
  const balanceMap = await getAccountBalanceMap("1900-01-01", asOfDate);
  const result: {
    id: string;
    code: string;
    name: string;
    type: string;
    debit: number;
    credit: number;
  }[] = [];

  let totalDebit = 0;
  let totalCredit = 0;

  for (const account of accounts) {
    const balance = Number(balanceMap.get(account.id) ?? 0);
    const isDebitNormal =
      account.type === "asset" || account.type === "expense";

    let debit = 0;
    let credit = 0;

    if (isDebitNormal) {
      if (balance > 0) debit = balance;
      else credit = Math.abs(balance);
    } else {
      if (balance > 0) credit = balance;
      else debit = Math.abs(balance);
    }

    if (debit !== 0 || credit !== 0) {
      result.push({
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        debit,
        credit,
      });
      totalDebit += debit;
      totalCredit += credit;
    }
  }

  return {
    asOfDate,
    accounts: result,
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
  };
}

// Helper Functions

async function getAccountBalanceMap(
  startDate: string,
  endDate: string
): Promise<Map<string, number>> {
  const startPeriod = startDate.substring(0, 7);
  const endPeriod = endDate.substring(0, 7);

  const accounts = await getChartOfAccounts();
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  // Single grouped aggregate across all accounts (avoids per-account queries)
  const rows = await db
    .select({
      accountId: accountBalances.accountId,
      debitTotal: sql<string>`coalesce(sum(${accountBalances.debitTotal}), 0)`,
      creditTotal: sql<string>`coalesce(sum(${accountBalances.creditTotal}), 0)`,
    })
    .from(accountBalances)
    .where(
      and(
        gte(accountBalances.period, startPeriod),
        lte(accountBalances.period, endPeriod)
      )
    )
    .groupBy(accountBalances.accountId);

  const balanceMap = new Map<string, number>();
  for (const row of rows) {
    const account = accountMap.get(row.accountId);
    const isDebitNormal =
      account?.type === "asset" || account?.type === "expense";
    const totalDebit = Number(row.debitTotal);
    const totalCredit = Number(row.creditTotal);
    const balance = isDebitNormal
      ? totalDebit - totalCredit
      : totalCredit - totalDebit;
    balanceMap.set(row.accountId, balance);
  }

  return balanceMap;
}

async function getNetIncomeForPeriod(startDate: string, endDate: string) {
  const revenueAccounts = await getAccountsByType("revenue");
  const expenseAccounts = await getAccountsByType("expense");

  const balanceMap = await getAccountBalanceMap(startDate, endDate);

  let totalRevenue = 0;
  for (const account of revenueAccounts) {
    totalRevenue += Number(balanceMap.get(account.id) ?? 0);
  }

  let totalExpenses = 0;
  for (const account of expenseAccounts) {
    totalExpenses += Math.abs(Number(balanceMap.get(account.id) ?? 0));
  }

  return totalRevenue - totalExpenses;
}

export async function getAccountingOverview() {
  const now = new Date();
  const currentMonth = now.toISOString().substring(0, 7);
  const startDate = `${currentMonth}-01`;
  const endDate = now.toISOString().substring(0, 10);

  const accounts = await getActiveAccounts();
  const cumulativeMap = await getAccountBalanceMap("1900-01-01", endDate);
  const monthMap = await getAccountBalanceMap("1900-01-01", `${currentMonth}-31`);
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  for (const account of accounts) {
    const balance = Number(cumulativeMap.get(account.id) ?? 0);
    if (account.type === "asset") totalAssets += balance;
    else if (account.type === "liability")
      totalLiabilities += Math.abs(balance);
    else if (account.type === "equity") totalEquity += Math.abs(balance);
  }

  const incomeStatement = await getIncomeStatement(startDate, endDate);

  const recentEntries = await getJournalEntries({ limit: 5 });

  const accountSummary = accounts.slice(0, 10).map((account) => ({
    id: account.id,
    code: account.code,
    name: account.name,
    type: account.type,
    balance: monthMap.get(account.id) ?? 0,
  }));

  const investmentEntry = await db
    .select({ id: journalEntries.id })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.referenceType, INITIAL_INVESTMENT_REF),
        eq(journalEntries.status, "posted")
      )
    )
    .limit(1);

  return {
    totalAssets,
    totalLiabilities,
    totalEquity,
    netIncome: incomeStatement.netIncome,
    recentEntries,
    accountSummary,
    hasInitialInvestment: Boolean(investmentEntry[0]),
  };
}

// Initial Investment / Opening Capital

export const INITIAL_INVESTMENT_REF = "initial_investment";

export async function getInitialInvestments() {
  const entries = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.referenceType, INITIAL_INVESTMENT_REF))
    .orderBy(desc(journalEntries.date), desc(journalEntries.createdAt));

  const entryIds = entries.map((e) => e.id);
  const lines =
    entryIds.length > 0
      ? await db
          .select()
          .from(journalEntryLines)
          .where(inArray(journalEntryLines.journalEntryId, entryIds))
      : [];
  const linesByEntry = new Map<string, (typeof lines)[number][]>();
  for (const line of lines) {
    const list = linesByEntry.get(line.journalEntryId) ?? [];
    list.push(line);
    linesByEntry.set(line.journalEntryId, list);
  }

  const accounts = await getChartOfAccounts();
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const investments = entries.map((e) => ({
    id: e.id,
    entryNumber: e.entryNumber,
    date: e.date.toISOString().substring(0, 10),
    description: e.description,
    status: e.status,
    amount: Number(e.totalDebit),
    lines: (linesByEntry.get(e.id) ?? []).map((l) => ({
      accountId: l.accountId,
      accountCode: accountMap.get(l.accountId)?.code,
      accountName: accountMap.get(l.accountId)?.name,
      debit: Number(l.debit),
      credit: Number(l.credit),
    })),
  }));

  const total = investments
    .filter((i) => i.status !== "voided")
    .reduce((sum, i) => sum + i.amount, 0);

  return { investments, total };
}

// Creates AND posts the opening capital entry: Debit fund asset, Credit Owner's Equity.
export async function recordInitialInvestment(input: {
  date: string;
  amount: number;
  fundAccountCode: string;
  note?: string;
}) {
  await ensureStandardAccounts();

  const amount = Number(input.amount) || 0;
  if (amount <= 0) {
    throw new Error("Investment amount must be greater than zero");
  }

  const fundAccount = await getAccountByCode(input.fundAccountCode || "1000");
  if (!fundAccount || fundAccount.type !== "asset") {
    throw new Error(
      `Fund account "${input.fundAccountCode}" is not a valid asset account`
    );
  }

  const equityAccount = await getAccountByCode("3000");
  if (!equityAccount) {
    throw new Error("Owner's Equity account is missing from the chart of accounts");
  }

  const note = input.note?.trim() || "Initial investment / opening capital";
  const description = `${note} - into ${fundAccount.name}`;

  const entryId = await postAutoEntry({
    date: input.date,
    description,
    referenceType: INITIAL_INVESTMENT_REF,
    referenceId: crypto.randomUUID(),
    lines: [
      {
        accountId: fundAccount.id,
        debit: amount,
        credit: 0,
        description: `Capital invested into ${fundAccount.name}`,
      },
      {
        accountId: equityAccount.id,
        debit: 0,
        credit: amount,
        description: "Owner's equity",
      },
    ],
  });

  const isCashFund = fundAccount.code === "1000";
  const linkedTransactionId = `${INITIAL_INVESTMENT_REF}-${entryId}`;
  const existingTx = await getTransactionByRef(linkedTransactionId);
  
  // For bank/online investments, ensure a payment account exists or get the first active one
  let accountId: string | null = null;
  if (!isCashFund) {
    // Import payment account functions
    const { getPaymentAccounts, createPaymentAccount } = await import("./payments");
    const accounts = await getPaymentAccounts();
    
    // Find first active netbanking account, or create one if none exists
    const targetAccount = accounts.find((a) => a.method === "netbanking" && a.status === "active");
    
    
    if (!targetAccount) {
      // Create a default bank account for initial investment
      const accountIdNew = crypto.randomUUID();
      await createPaymentAccount({
        id: accountIdNew,
        accountName: "Primary Bank Account",
        holderName: "Business",
        method: "netbanking",
        accountNumber: "INVESTMENT-ACCOUNT",
        phoneNumber: null,
        bankName: "Initial Investment",
        branch: null,
        openingBalance: "0", // Opening balance will be updated via transaction
        qrCode: null,
        notes: "Auto-created for initial investment",
        status: "active",
      });
      accountId = accountIdNew;
    } else {
      accountId = targetAccount.id;
    }
  }

  if (!existingTx) {
    await createTransaction({
      id: crypto.randomUUID(),
      type: isCashFund ? "cash_received" : "online_received",
      amount: String(amount),
      receivedFrom: note,
      paymentMethod: isCashFund ? "cash" : "bank",
      accountId: accountId || null,
      transactionId: linkedTransactionId,
      notes: `Initial investment of ${amount} into ${fundAccount.name}`,
    });
  }

  return entryId;
}

// Automated Entries (wired to operational transactions)

const STANDARD_ACCOUNTS = [
  { id: "1000", code: "1000", name: "Cash", type: "asset" as const, subType: "current_asset" as const },
  { id: "1010", code: "1010", name: "Bank", type: "asset" as const, subType: "current_asset" as const },
  { id: "1200", code: "1200", name: "Accounts Receivable", type: "asset" as const, subType: "current_asset" as const },
  { id: "1300", code: "1300", name: "Inventory", type: "asset" as const, subType: "current_asset" as const },
  { id: "2000", code: "2000", name: "Accounts Payable", type: "liability" as const, subType: "current_liability" as const },
  { id: "3000", code: "3000", name: "Owner's Equity", type: "equity" as const, subType: "equity" as const },
  { id: "4000", code: "4000", name: "Sales Revenue", type: "revenue" as const, subType: "revenue" as const },
  { id: "5000", code: "5000", name: "Cost of Goods Sold", type: "expense" as const, subType: "cogs" as const },
  { id: "5100", code: "5100", name: "Operating Expenses", type: "expense" as const, subType: "operating_expense" as const },
];

export async function ensureStandardAccounts() {
  for (const a of STANDARD_ACCOUNTS) {
    const existing = await getAccountByCode(a.code);
    if (!existing) {
      await createAccount({
        id: a.id,
        code: a.code,
        name: a.name,
        type: a.type,
        subType: a.subType,
      });
    }
  }
}

// Cash flows land on account 1000 (Cash); every other payment method
// (bank/esewa/khalti/fonepay/card) is bucketed into account 1010 (Bank).
function resolveFundAccountId(paymentMethod?: string | null): string {
  return paymentMethod === "cash" ? "1000" : "1010";
}

type AutoLine = {
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
};

// Creates AND posts a journal entry directly, idempotent per reference.
// If an entry already exists for the reference it is returned as-is, UNLESS it
// was voided - in that case a fresh replacement entry is created so the source
// event can be re-recorded after a void (e.g. an order re-delivered).
export async function postAutoEntry(input: {
  date: string;
  description: string;
  referenceType: string;
  referenceId: string;
  lines: AutoLine[];
}) {
  const existing = await db
    .select({ id: journalEntries.id, status: journalEntries.status })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.referenceType, input.referenceType),
        eq(journalEntries.referenceId, input.referenceId)
      )
    )
    .limit(1);
  if (existing[0] && existing[0].status !== "voided") return existing[0].id;

  const totalDebit = input.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = input.lines.reduce((s, l) => s + l.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(
      `Auto entry unbalanced: debit ${totalDebit} vs credit ${totalCredit}`
    );
  }

  const id = crypto.randomUUID();
  // Header, lines and account balances are applied atomically, and the entry
  // number is allocated under a lock so concurrent auto-entries cannot collide.
  await db.transaction(async (tx) => {
    await tx.insert(journalEntries).values({
      id,
      entryNumber: await nextEntryNumber(tx),
      date: new Date(input.date),
      description: input.description,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      status: "posted",
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
    });

    await tx.insert(journalEntryLines).values(
      input.lines.map((l) => ({
        id: crypto.randomUUID(),
        journalEntryId: id,
        accountId: l.accountId,
        debit: l.debit.toFixed(2),
        credit: l.credit.toFixed(2),
        description: l.description,
      }))
    );

    await updateAccountBalances(
      {
        lines: input.lines.map((l) => ({
          accountId: l.accountId,
          debit: l.debit.toFixed(2),
          credit: l.credit.toFixed(2),
        })),
        date: new Date(input.date),
      },
      tx
    );
  });

  return id;
}

// Recognise revenue (cash or on credit) and COGS when an order is delivered.
export async function recordOrderSale(order: {
  id: number;
  total: string;
  dueAmount?: string;
  items: { menuItemId: number | null; quantity: number }[];
}) {
  await ensureStandardAccounts();

  const menuItemIds = order.items
    .map((i) => i.menuItemId)
    .filter((id): id is number => id != null);

  const linkedProducts =
    menuItemIds.length > 0
      ? await db
          .select({
            menuItemId: supplierProducts.menuItemId,
            costPrice: supplierProducts.costPrice,
            unitsPerPack: supplierProducts.unitsPerPack,
          })
          .from(supplierProducts)
          .where(
            and(
              inArray(supplierProducts.menuItemId, menuItemIds),
              eq(supplierProducts.productType, "direct_sellable")
            )
          )
      : [];

  const productByMenuItem = new Map(
    linkedProducts.map((p) => [p.menuItemId, p])
  );

  let cogs = 0;

  for (const item of order.items) {
    if (!item.menuItemId) continue;
    const linked = productByMenuItem.get(item.menuItemId);
    if (linked) {
      const costPerUnit =
        Number(linked.costPrice) / (Number(linked.unitsPerPack) || 1);
      cogs += costPerUnit * Number(item.quantity);
    }
  }

  const menuItemIdsWithoutLink = order.items
    .filter((i) => i.menuItemId && !productByMenuItem.has(i.menuItemId))
    .map((i) => i.menuItemId as number);

  if (menuItemIdsWithoutLink.length > 0) {
    const recipeRows = await db
      .select({ id: recipes.id, menuItemId: recipes.menuItemId })
      .from(recipes)
      .where(inArray(recipes.menuItemId, menuItemIdsWithoutLink));

    const recipeIds = recipeRows.map((r) => r.id);
    const recipeByMenuItem = new Map(
      recipeRows.map((r) => [r.menuItemId, r.id])
    );

    if (recipeIds.length > 0) {
      const ingredients = await db
        .select({
          recipeId: recipeIngredients.recipeId,
          qty: recipeIngredients.quantity,
          pricePerUnit: inventoryItems.pricePerUnit,
        })
        .from(recipeIngredients)
        .innerJoin(
          inventoryItems,
          eq(recipeIngredients.inventoryItemId, inventoryItems.id)
        )
        .where(inArray(recipeIngredients.recipeId, recipeIds));

      const costByRecipe = new Map<number, number>();
      for (const ing of ingredients) {
        const current = costByRecipe.get(ing.recipeId) || 0;
        costByRecipe.set(
          ing.recipeId,
          current + Number(ing.qty) * Number(ing.pricePerUnit)
        );
      }

      for (const item of order.items) {
        if (!item.menuItemId) continue;
        const recipeId = recipeByMenuItem.get(item.menuItemId);
        if (!recipeId) continue;
        const costPerServing = costByRecipe.get(recipeId) || 0;
        cogs += costPerServing * Number(item.quantity);
      }
    }
  }

  const total = Number(order.total) || 0;

  // Determine how much of this order was already paid at checkout (cash vs
  // online). Those amounts land directly in the correct fund account (Cash or
  // Bank) at delivery, and only the unpaid remainder is booked as a receivable.
  // This avoids booking a receivable for money already received and keeps the
  // ledger in sync with /payment for partial payments made before delivery.
  const orderTxs = await db
    .select({
      type: transactions.type,
      amount: transactions.amount,
      paymentMethod: transactions.paymentMethod,
    })
    .from(transactions)
    .where(eq(transactions.receivedFrom, `Order #${order.id}`));

  let cashReceived = 0;
  let onlineReceived = 0;
  for (const t of orderTxs) {
    const amt = Number(t.amount) || 0;
    if (t.type === "cash_received") cashReceived += amt;
    else if (t.type === "online_received") onlineReceived += amt;
  }

  // Cap the booked receipts at the order total so an overpayment (credited
  // separately to the customer) cannot produce an unbalanced entry.
  if (cashReceived + onlineReceived > total) {
    const excess = cashReceived + onlineReceived - total;
    const reduceCash = Math.min(cashReceived, excess);
    cashReceived -= reduceCash;
    onlineReceived -= excess - reduceCash;
  }
  const receivable = Math.max(0, total - cashReceived - onlineReceived);

  const lines: AutoLine[] = [];
  if (cashReceived > 0) {
    lines.push({ accountId: "1000", debit: cashReceived, credit: 0, description: "Cash received on delivery" });
  }
  if (onlineReceived > 0) {
    lines.push({ accountId: "1010", debit: onlineReceived, credit: 0, description: "Bank received on delivery" });
  }
  if (receivable > 0) {
    lines.push({ accountId: "1200", debit: receivable, credit: 0, description: "Accounts receivable" });
  }
  lines.push({ accountId: "4000", debit: 0, credit: total, description: "Sales revenue" });

  if (cogs > 0) {
    lines.push({ accountId: "5000", debit: cogs, credit: 0, description: "Cost of goods sold" });
    lines.push({ accountId: "1300", debit: 0, credit: cogs, description: "Inventory reduction" });
  }

  return postAutoEntry({
    date: new Date().toISOString().slice(0, 10),
    description: `Sale - Order #${order.id}`,
    referenceType: "order",
    referenceId: String(order.id),
    lines,
  });
}

// Record supplier credit purchases and supplier payments.
export async function recordSupplierSettlement(settlement: {
  id: number;
  type: "purchase" | "payment";
  amount: string;
}) {
  await ensureStandardAccounts();
  const amount = Number(settlement.amount) || 0;

  const [row] = await db
    .select({ name: suppliers.name, paymentMethod: supplierSettlements.paymentMethod })
    .from(supplierSettlements)
    .innerJoin(suppliers, eq(supplierSettlements.supplierId, suppliers.id))
    .where(eq(supplierSettlements.id, settlement.id))
    .limit(1);

  const supplierName = row?.name || `Supplier #${settlement.id}`;
  const fundAccountId = resolveFundAccountId(row?.paymentMethod);
  const fundLabel = fundAccountId === "1000" ? "Cash" : "Bank";

  const lines: AutoLine[] =
    settlement.type === "purchase"
      ? [
          { accountId: "1300", debit: amount, credit: 0, description: `Inventory purchased from ${supplierName}` },
          { accountId: "2000", debit: 0, credit: amount, description: `Accounts payable - ${supplierName}` },
        ]
      : [
          { accountId: "2000", debit: amount, credit: 0, description: `AP cleared - ${supplierName}` },
          { accountId: fundAccountId, debit: 0, credit: amount, description: `${fundLabel} paid to ${supplierName}` },
        ];

  return postAutoEntry({
    date: new Date().toISOString().slice(0, 10),
    description: `${settlement.type === "purchase" ? "Purchase from" : "Payment to"} ${supplierName}`,
    referenceType: `supplier_${settlement.type}`,
    referenceId: String(settlement.id),
    lines,
  });
}

// Create a rectification entry when an existing supplier settlement amount is changed
// or when a settlement is deleted (newAmount = "0").
// The original journal entry stays untouched for audit trail purposes.
// Every rectification line references the original entry ID for full traceability.
export async function recordSettlementAdjustment(settlement: {
  id: number;
  type: "purchase" | "payment";
  oldAmount: string;
  newAmount: string;
}) {
  await ensureStandardAccounts();
  const oldAmt = Number(settlement.oldAmount) || 0;
  const newAmt = Number(settlement.newAmount) || 0;
  const delta = newAmt - oldAmt;
  if (Math.abs(delta) < 0.01) return null;

  const [originalEntry] = await db
    .select({ id: journalEntries.id, entryNumber: journalEntries.entryNumber })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.referenceType, `supplier_${settlement.type}`),
        eq(journalEntries.referenceId, String(settlement.id))
      )
    )
    .limit(1);

  const originalRef = originalEntry
    ? `${originalEntry.entryNumber} (${originalEntry.id})`
    : "unknown";

  const [supplierRow] = await db
    .select({ name: suppliers.name, paymentMethod: supplierSettlements.paymentMethod })
    .from(supplierSettlements)
    .innerJoin(suppliers, eq(supplierSettlements.supplierId, suppliers.id))
    .where(eq(supplierSettlements.id, settlement.id))
    .limit(1);

  const supplierName = supplierRow?.name || `Supplier #${settlement.id}`;
  const typeLabel = settlement.type === "purchase" ? "Purchase from" : "Payment to";
  const fundAccountId = resolveFundAccountId(supplierRow?.paymentMethod);
  const fundLabel = fundAccountId === "1000" ? "Cash" : "Bank";

  const isIncrease = delta > 0;
  const absDelta = Math.abs(delta);

  const lines: AutoLine[] =
    settlement.type === "purchase"
      ? [
          {
            accountId: "1300",
            debit: isIncrease ? absDelta : 0,
            credit: isIncrease ? 0 : absDelta,
            description: `Inventory ${isIncrease ? "increase" : "decrease"} rectifying ${originalRef} (${supplierName})`,
          },
          {
            accountId: "2000",
            debit: isIncrease ? 0 : absDelta,
            credit: isIncrease ? absDelta : 0,
            description: `AP ${isIncrease ? "increase" : "decrease"} rectifying ${originalRef} (${supplierName})`,
          },
        ]
      : [
          {
            accountId: "2000",
            debit: isIncrease ? absDelta : 0,
            credit: isIncrease ? 0 : absDelta,
            description: `AP ${isIncrease ? "increase" : "decrease"} rectifying ${originalRef} (${supplierName})`,
          },
          {
            accountId: fundAccountId,
            debit: isIncrease ? 0 : absDelta,
            credit: isIncrease ? absDelta : 0,
            description: `${fundLabel} ${isIncrease ? "decrease" : "increase"} rectifying ${originalRef} (${supplierName})`,
          },
        ];

  return postAutoEntry({
    date: new Date().toISOString().slice(0, 10),
    description: `Rectification - ${typeLabel} ${supplierName} (${oldAmt} → ${newAmt}) corrects ${originalRef}`,
    referenceType: `supplier_settlement_rect_${settlement.type}`,
    referenceId: `${settlement.id}-${Date.now()}`,
    lines,
  });
}

// Book cash received against a customer's receivable when a due is settled.
export async function recordCustomerPayment(input: {
  orderId: number;
  amount: number;
  referenceId: string;
  paymentMethod?: string;
}) {
  await ensureStandardAccounts();
  const amount = Number(input.amount) || 0;
  if (amount <= 0) return null;

  const fundAccountId = resolveFundAccountId(input.paymentMethod);
  const fundLabel = fundAccountId === "1000" ? "Cash" : "Bank";

  return postAutoEntry({
    date: new Date().toISOString().slice(0, 10),
    description: `Payment received - Order #${input.orderId}`,
    referenceType: "order_payment",
    referenceId: input.referenceId,
    lines: [
      { accountId: fundAccountId, debit: amount, credit: 0, description: `${fundLabel} received` },
      { accountId: "1200", debit: 0, credit: amount, description: "Accounts receivable cleared" },
    ],
  });
}

const TX_TO_REFERENCE_TYPE: Record<string, string> = {
  cash_received: "payment_cash_received",
  online_received: "payment_online_received",
  cash_paid: "payment_cash_paid",
  online_paid: "payment_online_paid",
  expense: "payment_expense",
  bank_transfer: "payment_bank_transfer",
  refund: "payment_refund",
};

// Posts the journal entry that mirrors a manual transaction recorded in /payment.
// Idempotent per transaction id: if the entry already exists it is not re-posted.
export async function postTransactionEntry(tx: {
  id: string;
  type: string;
  amount: number | string;
  paymentMethod?: string | null;
  accountId?: string | null;
  notes?: string | null;
  paidTo?: string | null;
  receivedFrom?: string | null;
}) {
  await ensureStandardAccounts();
  const amount = Number(tx.amount) || 0;
  if (amount <= 0) return null;

  const type = tx.type;
  const refType = TX_TO_REFERENCE_TYPE[type];
  if (!refType) return null;

  const existing = await db
    .select({ id: journalEntries.id, status: journalEntries.status })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.referenceType, refType),
        eq(journalEntries.referenceId, tx.id)
      )
    )
    .limit(1);
  // A voided entry is re-recorded via postAutoEntry below; only an existing
  // posted/draft entry short-circuits the idempotency check.
  if (existing.length > 0 && existing[0].status !== "voided") return existing[0];

  const note = tx.notes?.trim();

  const fundAccountId = resolveFundAccountId(tx.paymentMethod);
  const fundLabel = fundAccountId === "1000" ? "Cash" : "Bank";

  const description =
    type === "cash_received" || type === "online_received"
      ? `${fundLabel} received${tx.receivedFrom ? ` from ${tx.receivedFrom}` : ""}`
      : `${fundLabel} paid${tx.paidTo ? ` to ${tx.paidTo}` : ""}`;

  let lines: { accountId: string; debit: number; credit: number; description: string }[];
  switch (type) {
    case "cash_received":
    case "online_received":
      lines = [
        { accountId: fundAccountId, debit: amount, credit: 0, description: `${fundLabel} received` },
        { accountId: "4000", debit: 0, credit: amount, description: "Sales revenue" },
      ];
      break;
    case "cash_paid":
    case "online_paid":
    case "expense":
      lines = [
        { accountId: "5100", debit: amount, credit: 0, description: "Operating expenses" },
        { accountId: fundAccountId, debit: 0, credit: amount, description: `${fundLabel} paid` },
      ];
      break;
    case "bank_transfer":
      lines = [
        { accountId: "1010", debit: amount, credit: 0, description: "Bank transfer in" },
        { accountId: "1000", debit: 0, credit: amount, description: "Bank transfer out" },
      ];
      break;
    case "refund":
      lines = [
        { accountId: "4000", debit: amount, credit: 0, description: "Sales refund" },
        { accountId: fundAccountId, debit: 0, credit: amount, description: `${fundLabel} refunded` },
      ];
      break;
    default:
      return null;
  }

  return postAutoEntry({
    date: new Date().toISOString().slice(0, 10),
    description: description + (note ? ` - ${note}` : ""),
    referenceType: refType,
    referenceId: tx.id,
    lines,
  });
}
