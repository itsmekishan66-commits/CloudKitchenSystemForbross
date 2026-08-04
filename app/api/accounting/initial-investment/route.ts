import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  getInitialInvestments,
  recordInitialInvestment,
  voidJournalEntry,
} from "@/db/services/accounting";

export const dynamic = "force-dynamic";

function revalidateAccounting() {
  revalidateTag(CACHE_TAGS.JOURNAL_ENTRIES, "max");
  revalidateTag(CACHE_TAGS.ACCOUNTING_OVERVIEW, "max");
  revalidateTag(CACHE_TAGS.TRIAL_BALANCE, "max");
  revalidateTag(CACHE_TAGS.INCOME_STATEMENT, "max");
  revalidateTag(CACHE_TAGS.BALANCE_SHEET, "max");
  revalidateTag(CACHE_TAGS.CASH_FLOW, "max");
}

export async function GET() {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_ACCOUNTING);
    if (user instanceof NextResponse) return user;

    return NextResponse.json(await getInitialInvestments());
  } catch (error) {
    console.error("Failed to load initial investments:", error);
    return NextResponse.json(
      { error: "Failed to load initial investments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.CREATE_ACCOUNTING);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const { date, amount, fundAccountCode, note } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Investment amount must be greater than zero" },
        { status: 400 }
      );
    }
    if (!fundAccountCode) {
      return NextResponse.json(
        { error: "Fund account is required" },
        { status: 400 }
      );
    }

    const entryId = await recordInitialInvestment({
      date,
      amount: Number(amount),
      fundAccountCode,
      note,
    });

    revalidateAccounting();
    const data = await getInitialInvestments();
    return NextResponse.json({ entryId, ...data }, { status: 201 });
  } catch (error) {
    console.error("Failed to record initial investment:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to record initial investment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.CREATE_ACCOUNTING);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const { entryId, reason } = body;

    if (!entryId) {
      return NextResponse.json(
        { error: "entryId is required" },
        { status: 400 }
      );
    }
    if (!reason?.trim()) {
      return NextResponse.json(
        { error: "A void reason is required" },
        { status: 400 }
      );
    }

    await voidJournalEntry(entryId, reason.trim());

    revalidateAccounting();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to void initial investment:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to void initial investment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
