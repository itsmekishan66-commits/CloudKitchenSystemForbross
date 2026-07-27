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
  type NewChartOfAccount,
} from "@/db/schemas";


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

export async function generateEntryNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(journalEntries)
    .where(sql`year(${journalEntries.date}) = ${year}`);
  const seq = (result[0]?.count || 0) + 1;
  return `JE-${year}-${String(seq).padStart(4, "0")}`;
}

export async function getJournalEntries(filters?: {
  status?: "draft" | "posted" | "voided";
  startDate?: string;
  endDate?: string;
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
  const entryNumber = await generateEntryNumber();

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

  await db.insert(journalEntries).values({
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
    await db.insert(journalEntryLines).values({
      id: line.id,
      journalEntryId: data.id,
      accountId: line.accountId,
      debit: line.debit || "0",
      credit: line.credit || "0",
      description: line.description,
    });
  }

  return getJournalEntryById(data.id);
}

export async function postJournalEntry(id: string) {
  const entry = await getJournalEntryById(id);
  if (!entry) throw new Error("Journal entry not found");
  if (entry.status === "posted")
    throw new Error("Journal entry is already posted");
  if (entry.status === "voided")
    throw new Error("Cannot post a voided journal entry");

  await db
    .update(journalEntries)
    .set({ status: "posted", updatedAt: new Date() })
    .where(eq(journalEntries.id, id));

  await updateAccountBalances(entry);

  return getJournalEntryById(id);
}

export async function voidJournalEntry(id: string, reason: string) {
  const entry = await getJournalEntryById(id);
  if (!entry) throw new Error("Journal entry not found");
  if (entry.status === "voided")
    throw new Error("Journal entry is already voided");

  await db
    .update(journalEntries)
    .set({
      status: "voided",
      voidReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(journalEntries.id, id));

  if (entry.status === "posted") {
    await reverseAccountBalances(entry);
  }

  return getJournalEntryById(id);
}

// Account Balances

async function updateAccountBalances(entry: {
  lines: { accountId: string; debit: string; credit: string }[];
  date: Date;
}) {
  const period = entry.date.toISOString().substring(0, 7);
  const accountIds = entry.lines.map((l) => l.accountId);

  // Batch-fetch existing balances and accounts once (avoids per-line N+1)
  const existingRows =
    accountIds.length > 0
      ? await db
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

  const accounts = await getChartOfAccounts();
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

      await db
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

      await db.insert(accountBalances).values({
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

async function reverseAccountBalances(entry: {
  lines: { accountId: string; debit: string; credit: string }[];
  date: Date;
}) {
  const period = entry.date.toISOString().substring(0, 7);
  const accountIds = entry.lines.map((l) => l.accountId);

  const existingRows =
    accountIds.length > 0
      ? await db
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

  const accounts = await getChartOfAccounts();
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

      await db
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

  const revenue: { account: string; amount: number }[] = [];
  let totalRevenue = 0;

  for (const account of revenueAccounts) {
    const amount = Number(balanceMap.get(account.id) ?? 0);
    if (amount !== 0) {
      revenue.push({ account: account.name, amount });
      totalRevenue += amount;
    }
  }

  const cogs: { account: string; amount: number }[] = [];
  let totalCogs = 0;
  const operatingExpenses: { account: string; amount: number }[] = [];
  let totalOperatingExpenses = 0;
  const nonOperatingExpenses: { account: string; amount: number }[] = [];
  let totalNonOperatingExpenses = 0;

  for (const account of expenseAccounts) {
    const amount = Math.abs(Number(balanceMap.get(account.id) ?? 0));
    if (amount !== 0) {
      if (account.subType === "cogs") {
        cogs.push({ account: account.name, amount });
        totalCogs += amount;
      } else if (account.subType === "operating_expense") {
        operatingExpenses.push({ account: account.name, amount });
        totalOperatingExpenses += amount;
      } else {
        nonOperatingExpenses.push({ account: account.name, amount });
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

  // Two balance maps cover the distinct period ranges used below (avoids per-account N+1)
  const cumulativeMap = await getAccountBalanceMap("1900-01-01", asOfDate);
  const periodMap = await getAccountBalanceMap(asOfDate, asOfDate);

  const assets: {
    category: string;
    accounts: { name: string; balance: number }[];
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
    const items: { name: string; balance: number }[] = [];
    let catTotal = 0;

    for (const account of accounts) {
      const balance = Number(cumulativeMap.get(account.id) ?? 0);
      if (balance !== 0) {
        items.push({ name: account.name, balance });
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
    accounts: { name: string; balance: number }[];
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
    const items: { name: string; balance: number }[] = [];
    let catTotal = 0;

    for (const account of accounts) {
      const balance = Math.abs(Number(periodMap.get(account.id) ?? 0));
      if (balance !== 0) {
        items.push({ name: account.name, balance });
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

  const equity: { name: string; balance: number }[] = [];
  let totalEquity = 0;

  for (const account of equityAccounts) {
    if (!account.isActive) continue;
    const balance = Math.abs(Number(periodMap.get(account.id) ?? 0));
    if (balance !== 0) {
      equity.push({ name: account.name, balance });
      totalEquity += balance;
    }
  }

  const netIncome = await getNetIncomeForPeriod("1900-01-01", asOfDate);
  if (netIncome !== 0) {
    equity.push({ name: "Retained Earnings (Current Period)", balance: netIncome });
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
  const balanceMap = await getAccountBalanceMap(asOfDate, asOfDate);
  const result: {
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

  return {
    totalAssets,
    totalLiabilities,
    totalEquity,
    netIncome: incomeStatement.netIncome,
    recentEntries,
    accountSummary,
  };
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

type AutoLine = {
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
};

// Creates AND posts a journal entry directly, idempotent per reference.
export async function postAutoEntry(input: {
  date: string;
  description: string;
  referenceType: string;
  referenceId: string;
  lines: AutoLine[];
}) {
  const existing = await db
    .select({ id: journalEntries.id })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.referenceType, input.referenceType),
        eq(journalEntries.referenceId, input.referenceId)
      )
    )
    .limit(1);
  if (existing[0]) return existing[0].id;

  const totalDebit = input.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = input.lines.reduce((s, l) => s + l.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(
      `Auto entry unbalanced: debit ${totalDebit} vs credit ${totalCredit}`
    );
  }

  const id = crypto.randomUUID();
  await db.insert(journalEntries).values({
    id,
    entryNumber: await generateEntryNumber(),
    date: new Date(input.date),
    description: input.description,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    status: "posted",
    totalDebit: totalDebit.toFixed(2),
    totalCredit: totalCredit.toFixed(2),
  });

  await db.insert(journalEntryLines).values(
    input.lines.map((l) => ({
      id: crypto.randomUUID(),
      journalEntryId: id,
      accountId: l.accountId,
      debit: l.debit.toFixed(2),
      credit: l.credit.toFixed(2),
      description: l.description,
    }))
  );

  await updateAccountBalances({
    lines: input.lines.map((l) => ({
      accountId: l.accountId,
      debit: l.debit.toFixed(2),
      credit: l.credit.toFixed(2),
    })),
    date: new Date(input.date),
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

  // Revenue is recognised as a receivable at delivery; cash is booked when
  // the customer actually pays (see recordCustomerPayment).
  const lines: AutoLine[] = [];
  lines.push({ accountId: "1200", debit: total, credit: 0, description: "Accounts receivable" });
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
    .select({ name: suppliers.name })
    .from(supplierSettlements)
    .innerJoin(suppliers, eq(supplierSettlements.supplierId, suppliers.id))
    .where(eq(supplierSettlements.id, settlement.id))
    .limit(1);

  const supplierName = row?.name || `Supplier #${settlement.id}`;

  const lines: AutoLine[] =
    settlement.type === "purchase"
      ? [
          { accountId: "1300", debit: amount, credit: 0, description: `Inventory purchased from ${supplierName}` },
          { accountId: "2000", debit: 0, credit: amount, description: `Accounts payable - ${supplierName}` },
        ]
      : [
          { accountId: "2000", debit: amount, credit: 0, description: `AP cleared - ${supplierName}` },
          { accountId: "1000", debit: 0, credit: amount, description: `Cash paid to ${supplierName}` },
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
    .select({ name: suppliers.name })
    .from(supplierSettlements)
    .innerJoin(suppliers, eq(supplierSettlements.supplierId, suppliers.id))
    .where(eq(supplierSettlements.id, settlement.id))
    .limit(1);

  const supplierName = supplierRow?.name || `Supplier #${settlement.id}`;
  const typeLabel = settlement.type === "purchase" ? "Purchase from" : "Payment to";

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
            accountId: "1000",
            debit: isIncrease ? 0 : absDelta,
            credit: isIncrease ? absDelta : 0,
            description: `Cash ${isIncrease ? "decrease" : "increase"} rectifying ${originalRef} (${supplierName})`,
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
}) {
  await ensureStandardAccounts();
  const amount = Number(input.amount) || 0;
  if (amount <= 0) return null;

  return postAutoEntry({
    date: new Date().toISOString().slice(0, 10),
    description: `Payment received - Order #${input.orderId}`,
    referenceType: "order_payment",
    referenceId: input.referenceId,
    lines: [
      { accountId: "1000", debit: amount, credit: 0, description: "Cash received" },
      { accountId: "1200", debit: 0, credit: amount, description: "Accounts receivable cleared" },
    ],
  });
}
