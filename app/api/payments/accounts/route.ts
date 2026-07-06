import { NextResponse } from "next/server";

import { getPaymentAccounts, createPaymentAccount, getAccountBalances } from "@/db/services/payments";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_PAYMENTS);
    if (user instanceof NextResponse) return user;

    const accounts = await getAccountBalances();
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Failed to load payment accounts", error);
    return NextResponse.json({ error: "Unable to load payment accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.CREATE_PAYMENTS);
    if (user instanceof NextResponse) return user;

    const payload = await request.json();
    const { accountName, holderName, method, accountNumber, phoneNumber, bankName, branch, openingBalance, qrCode, notes } = payload;

    if (!accountName || !holderName || !method || !accountNumber) {
      return NextResponse.json({ error: "Account name, holder name, method, and account number are required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    await createPaymentAccount({
      id,
      accountName,
      holderName,
      method,
      accountNumber,
      phoneNumber: phoneNumber || null,
      bankName: bankName || null,
      branch: branch || null,
      openingBalance: String(openingBalance || 0),
      qrCode: qrCode || null,
      notes: notes || null,
      status: "active",
    });

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create payment account", error);
    return NextResponse.json({ error: "Unable to create payment account" }, { status: 500 });
  }
}
