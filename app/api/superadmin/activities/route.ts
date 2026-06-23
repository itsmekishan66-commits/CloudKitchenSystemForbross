import { NextResponse } from "next/server";

import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { getActivityLogs, createActivityLog } from "@/db/services/activity-logs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.VIEW_USERS
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const logs = await getActivityLogs(100);
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Failed to load activity logs", error);
    return NextResponse.json({ error: "Unable to load activity logs" }, { status: 500 });
  }
}
