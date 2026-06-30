import { NextResponse } from "next/server";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { getAllSupplierProductsWithSupplier } from "@/db/services/suppliers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_INVENTORY);
    if (user instanceof NextResponse) return user;

    const items = await getAllSupplierProductsWithSupplier();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to load supplier stock", error);
    return NextResponse.json({ error: "Unable to load supplier stock" }, { status: 500 });
  }
}
