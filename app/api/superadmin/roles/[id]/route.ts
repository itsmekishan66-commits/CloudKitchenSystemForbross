import { NextResponse } from "next/server";

import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { updateRoleAction, deleteRoleAction, getRoleAction } from "@/app/(superadmin)/_action/roles";
import { createActivityLog } from "@/db/services/activity-logs";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_ROLES);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const roleId = Number(id);
    
    if (!Number.isInteger(roleId)) {
      return NextResponse.json({ error: "Invalid role ID" }, { status: 400 });
    }

    // Check if role exists and is not a system role
    const role = await getRoleAction(roleId);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const systemRoles = [
      "super-admin", "admin", "staff", "customer", 
      "kitchen-manager", "payment-manager", "support-staff"
    ];
    if (systemRoles.includes(role.name)) {
      return NextResponse.json({ error: "Cannot modify system role" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    await updateRoleAction(roleId, name.trim(), description);

    await createActivityLog({
      userId: user.id,
      action: `Updated role "${role.name}" to "${name}"`,
      entityType: "role",
      entityId: roleId,
      details: { oldName: role.name, newName: name, description },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update role", error);
    return NextResponse.json({ error: "Unable to update role" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.DELETE_ROLES);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const roleId = Number(id);
    
    if (!Number.isInteger(roleId)) {
      return NextResponse.json({ error: "Invalid role ID" }, { status: 400 });
    }

    // Check if role exists and is not a system role
    const role = await getRoleAction(roleId);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const systemRoles = [
      "super-admin", "admin", "staff", "customer", 
      "kitchen-manager", "payment-manager", "support-staff"
    ];
    if (systemRoles.includes(role.name)) {
      return NextResponse.json({ error: "Cannot delete system role" }, { status: 403 });
    }

    await deleteRoleAction(roleId);

    await createActivityLog({
      userId: user.id,
      action: `Deleted role "${role.name}"`,
      entityType: "role",
      entityId: roleId,
      details: { name: role.name },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete role", error);
    return NextResponse.json({ error: "Unable to delete role" }, { status: 500 });
  }
}