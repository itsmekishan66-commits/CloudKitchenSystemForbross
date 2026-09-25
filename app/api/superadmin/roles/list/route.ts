import { NextResponse } from "next/server";

import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { getRoles } from "@/db/services/roles";
import { getPermissionsForRole } from "@/db/services/permissions";
import { createActivityLog } from "@/db/services/activity-logs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.VIEW_ROLES
    );

    if (user instanceof NextResponse) {
      return user;
    }

    const roles = await getRoles();
    
    // Fetch permissions for each role
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const permissions = await getPermissionsForRole(role.id);
        return {
          ...role,
          permissions: permissions.map(p => p.name),
        };
      })
    );

    return NextResponse.json({ roles: rolesWithPermissions });
  } catch (error) {
    console.error("Failed to load roles", error);
    return NextResponse.json({ error: "Unable to load roles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.CREATE_ROLES);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const { name, description, permissions: permissionNames } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    const { createRoleAction } = await import("@/app/(superadmin)/_action/roles");
    const roleId = await createRoleAction(name.trim(), permissionNames || [], description);

    await createActivityLog({
      userId: user.id,
      action: `Created role "${name}"`,
      entityType: "role",
      entityId: roleId,
      details: { name, description, permissions: permissionNames },
    });

    return NextResponse.json({ ok: true, roleId });
  } catch (error) {
    console.error("Failed to create role", error);
    return NextResponse.json({ error: "Unable to create role" }, { status: 500 });
  }
}