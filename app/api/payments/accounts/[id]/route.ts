import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { getPaymentAccountById, updatePaymentAccount, deletePaymentAccount } from "@/db/services/payments";
import { CACHE_TAGS } from "@/lib/cache-tags";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_PAYMENTS);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const account = await getPaymentAccountById(id);
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    return NextResponse.json({ account });
  } catch (error) {
    console.error("Failed to load payment account", error);
    return NextResponse.json({ error: "Unable to load payment account" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_PAYMENTS);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const payload = await request.json();
    const { accountName, holderName, method, accountNumber, phoneNumber, bankName, branch, openingBalance, qrCode, notes, status } = payload;

    const existing = await getPaymentAccountById(id);
    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    await updatePaymentAccount(id, {
      accountName: accountName ?? existing.accountName,
      holderName: holderName ?? existing.holderName,
      method: method ?? existing.method,
      accountNumber: accountNumber ?? existing.accountNumber,
      phoneNumber: phoneNumber ?? existing.phoneNumber,
      bankName: bankName ?? existing.bankName,
      branch: branch ?? existing.branch,
      openingBalance: openingBalance !== undefined ? String(openingBalance) : existing.openingBalance,
      qrCode: qrCode !== undefined ? qrCode : existing.qrCode,
      notes: notes ?? existing.notes,
      status: status ?? existing.status,
    });

    revalidateTag(CACHE_TAGS.ACCOUNTING_OVERVIEW, "max");
    revalidateTag(CACHE_TAGS.BALANCE_SHEET, "max");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update payment account", error);
    return NextResponse.json({ error: "Unable to update payment account" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.DELETE_PAYMENTS);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const existing = await getPaymentAccountById(id);
    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    await deletePaymentAccount(id);
    revalidateTag(CACHE_TAGS.ACCOUNTING_OVERVIEW, "max");
    revalidateTag(CACHE_TAGS.BALANCE_SHEET, "max");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete payment account", error);
    return NextResponse.json({ error: "Unable to delete payment account" }, { status: 500 });
  }
}
