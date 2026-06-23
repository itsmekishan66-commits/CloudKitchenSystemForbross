import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { getRoleIdByName, getUsers } from "@/db/services/users";
import { users, roles as rolesTable } from "@/db/schemas";
import { createActivityLog } from "@/db/services/activity-logs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.VIEW_ROLES
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const allUsers = await getUsers();
    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error("Failed to load users", error);
    return NextResponse.json({ error: "Unable to load users" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.UPDATE_ROLES
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const body = await request.json();
    const userId = Number(body.id);
    const role = body.role;

    if (!Number.isInteger(userId) || !role) {
      return NextResponse.json({ error: "User id and role are required" }, { status: 400 });
    }

    const validRoles = ["super-admin", "admin", "staff", "customer", "kitchen-manager", "payment-manager", "support-staff"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const [target] = await db
      .select({ currentRole: rolesTable.name })
      .from(users)
      .leftJoin(rolesTable, eq(users.roleId, rolesTable.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (target?.currentRole === "super-admin") {
      return NextResponse.json({ error: "Cannot change a super-admin's role" }, { status: 403 });
    }

    const roleId = await getRoleIdByName(role);
    if (!roleId) {
      return NextResponse.json({ error: `Role "${role}" not found in database` }, { status: 400 });
    }
    await db.update(users).set({ roleId }).where(eq(users.id, userId));

    await createActivityLog({
      userId: user.id,
      action: `Updated user ${userId} role to ${role}`,
      entityType: "user",
      entityId: userId,
      details: { newRole: role },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update role", error);
    return NextResponse.json({ error: "Unable to update role" }, { status: 500 });
  }
}
