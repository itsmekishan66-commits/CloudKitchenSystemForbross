import { NextResponse } from "next/server";
import { getAccountTransactions } from "@/db/services/payments";
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
    const result = await getAccountTransactions(id);
    
    if (!result) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to load account transactions", error);
    return NextResponse.json(
      { error: "Unable to load transactions" }, 
      { status: 500 }
    );
  }
}
