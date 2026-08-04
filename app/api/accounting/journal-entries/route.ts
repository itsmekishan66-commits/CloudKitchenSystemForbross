import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  getJournalEntries,
  createJournalEntry,
} from "@/db/services/accounting";
import { getTransactions } from "@/db/services/payments";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_ACCOUNTING);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as
      | "draft"
      | "posted"
      | "voided"
      | undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const accountId = searchParams.get("accountId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const entries = await getJournalEntries({
      status: status || undefined,
      startDate,
      endDate,
      accountId,
      limit,
      offset,
    });

    // Attach the /payment reversal created when a voided entry was cancelled,
    // so the UI can show how much was deducted and from which balance.
    const allTx = await getTransactions();
    const reversals = new Map<string, {
      type: string;
      amount: string;
      paymentMethod: string;
      transactionId: string;
      notes: string | null;
    }>();
    for (const tx of allTx) {
      if (tx.transactionId?.startsWith("VOID-")) {
        reversals.set(tx.transactionId.slice("VOID-".length), {
          type: tx.type,
          amount: tx.amount,
          paymentMethod: tx.paymentMethod,
          transactionId: tx.transactionId,
          notes: tx.notes,
        });
      }
    }
    const enriched = entries.map((e) =>
      e.status === "voided" && reversals.has(e.entryNumber)
        ? { ...e, reversal: reversals.get(e.entryNumber) }
        : e
    );

    return NextResponse.json({ entries: enriched });
  } catch (error) {
    console.error("Failed to load journal entries:", error);
    return NextResponse.json(
      { error: "Failed to load journal entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.CREATE_ACCOUNTING);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const { date, description, referenceType, referenceId, lines } = body;

    if (!date || !description || !lines || lines.length < 2) {
      return NextResponse.json(
        {
          error:
            "Date, description, and at least 2 journal entry lines are required",
        },
        { status: 400 }
      );
    }

    for (const line of lines) {
      if (!line.accountId) {
        return NextResponse.json(
          { error: "Each line must have an accountId" },
          { status: 400 }
        );
      }
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);
      if (debit < 0 || credit < 0) {
        return NextResponse.json(
          { error: "Debit and credit amounts cannot be negative" },
          { status: 400 }
        );
      }
      if (debit > 0 && credit > 0) {
        return NextResponse.json(
          { error: "A line cannot have both debit and credit amounts" },
          { status: 400 }
        );
      }
    }

    const id = crypto.randomUUID();
    const entry = await createJournalEntry({
      id,
      date,
      description,
      referenceType,
      referenceId,
      createdBy: user.id,
      lines: lines.map(
        (line: { accountId: string; debit?: string; credit?: string; description?: string }) => ({
          id: crypto.randomUUID(),
          accountId: line.accountId,
          debit: line.debit || "0",
          credit: line.credit || "0",
          description: line.description,
        })
      ),
    });

    revalidateTag(CACHE_TAGS.JOURNAL_ENTRIES, "max");
    revalidateTag(CACHE_TAGS.ACCOUNTING_OVERVIEW, "max");
    revalidateTag(CACHE_TAGS.TRIAL_BALANCE, "max");
    revalidateTag(CACHE_TAGS.INCOME_STATEMENT, "max");
    revalidateTag(CACHE_TAGS.BALANCE_SHEET, "max");
    revalidateTag(CACHE_TAGS.CASH_FLOW, "max");
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Failed to create journal entry:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create journal entry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
