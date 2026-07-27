import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  getAccountById,
  updateAccount,
  deleteAccount,
} from "@/db/services/accounting";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_ACCOUNTING);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const account = await getAccountById(id);
    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ account });
  } catch (error) {
    console.error("Failed to load account:", error);
    return NextResponse.json(
      { error: "Failed to load account" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_ACCOUNTING);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const body = await request.json();
    const existing = await getAccountById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    const account = await updateAccount(id, body);

    revalidateTag(CACHE_TAGS.CHART_OF_ACCOUNTS, "max");
    revalidateTag(CACHE_TAGS.ACCOUNTING_OVERVIEW, "max");
    revalidateTag(CACHE_TAGS.TRIAL_BALANCE, "max");
    revalidateTag(CACHE_TAGS.INCOME_STATEMENT, "max");
    revalidateTag(CACHE_TAGS.BALANCE_SHEET, "max");
    revalidateTag(CACHE_TAGS.CASH_FLOW, "max");

    return NextResponse.json({ account });
  } catch (error) {
    console.error("Failed to update account:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.DELETE_ACCOUNTING);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const existing = await getAccountById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    await deleteAccount(id);

    revalidateTag(CACHE_TAGS.CHART_OF_ACCOUNTS, "max");
    revalidateTag(CACHE_TAGS.ACCOUNTING_OVERVIEW, "max");
    revalidateTag(CACHE_TAGS.TRIAL_BALANCE, "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
