import { NextResponse } from "next/server";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import {
  getChartOfAccounts,
  createAccount,
} from "@/db/services/accounting";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_ACCOUNTING);
    if (user instanceof NextResponse) return user;

    const accounts = await getChartOfAccounts();
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Failed to load chart of accounts:", error);
    return NextResponse.json(
      { error: "Failed to load chart of accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.CREATE_ACCOUNTING);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const { code, name, type, subType, description, parentId, openingBalance } =
      body;

    if (!code || !name || !type || !subType) {
      return NextResponse.json(
        { error: "Code, name, type, and subType are required" },
        { status: 400 }
      );
    }

    const validTypes = ["asset", "liability", "equity", "revenue", "expense"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const validSubTypes = [
      "current_asset",
      "fixed_asset",
      "current_liability",
      "long_term_liability",
      "equity",
      "revenue",
      "cogs",
      "operating_expense",
      "non_operating_expense",
    ];
    if (!validSubTypes.includes(subType)) {
      return NextResponse.json(
        {
          error: `Invalid subType. Must be one of: ${validSubTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const account = await createAccount({
      id,
      code,
      name,
      type,
      subType,
      description,
      parentId,
      openingBalance: openingBalance || "0",
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error("Failed to create account:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
