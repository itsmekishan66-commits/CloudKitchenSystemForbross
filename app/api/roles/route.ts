import { NextResponse } from "next/server";

import { db } from "@/db";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { roles } from "@/db/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_ROLES);

    if (user instanceof NextResponse) {
      return user;
    }

    const allRoles = await db
      .select({ id: roles.id, name: roles.name })
      .from(roles);

    return NextResponse.json({ roles: allRoles });
  } catch (error) {
    console.error("Failed to load roles", error);
    return NextResponse.json({ error: "Unable to load roles" }, { status: 500 });
  }
}
