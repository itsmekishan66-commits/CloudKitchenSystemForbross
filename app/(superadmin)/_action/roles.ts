"use server";

// Role & Permission management actions
import { createRole, updateRole, deleteRole, getRoleById } from "@/db/services/roles";
import { assignPermissionsForRole, getPermissionsForRole } from "@/db/services/permissions";
import { createUser } from "@/db/services/users";
import { hashPassword } from "@/lib/auth";
import { db } from "@/db";
import { permissions } from "@/db/schemas";
import { inArray } from "drizzle-orm";
import { updateTag } from "next/cache";

// Creates a new role with permissions (without creating a user)
export async function createRoleAction(
    name: string,
    permissionNames: string[],
    description?: string
) {
    const roleId = await createRole(name, description);

    // get permissions IDs from names
    const permissionRows = await db.select({ id: permissions.id }).from(permissions).where(
        inArray(permissions.name, permissionNames));

    const permissionsIds = permissionRows.map((p) => p.id);

    // assign permissions to role
    await assignPermissionsForRole(roleId, permissionsIds);

    updateTag("roles");
    return roleId;
}

// Legacy: creates a new role with permissions AND assigns it to a new user
export async function createRoleWithPermissionsAction(
    name: string,
    permissionNames: string[],
    userData: { userName: string; userEmail: string; userPhone: string; userAddress: string; userPassword: string }
) {
    const roleId = await createRole(name, `${name} role`);

    const permissionRows = await db.select({ id: permissions.id }).from(permissions).where(
        inArray(permissions.name, permissionNames));

    const permissionsIds = permissionRows.map((p) => p.id);

    await assignPermissionsForRole(roleId, permissionsIds);

    const passwordHash = userData.userPassword ? await hashPassword(userData.userPassword) : null;
    await createUser({
        name: userData.userName,
        email: userData.userEmail || null,
        phone: userData.userPhone || null,
        address: userData.userAddress || null,
        passwordHash,
        roleId,
    });

    updateTag("roles");
    return roleId;
}

export async function getRolePermissionsAction(roleId: number) {
    const rows = await getPermissionsForRole(roleId);
    return rows.map((r) => r.name);
}

export async function updateRolePermissionsAction(roleId: number, permissionNames: string[]) {
    const permissionRows = await db.select({ id: permissions.id }).from(permissions).where(
        inArray(permissions.name, permissionNames));
    const permissionsIds = permissionRows.map((p) => p.id);
    await assignPermissionsForRole(roleId, permissionsIds);
    updateTag("roles");
}

export async function updateRoleAction(roleId: number, name: string, description?: string) {
    await updateRole(roleId, name, description);
    updateTag("roles");
}

export async function deleteRoleAction(roleId: number) {
    await deleteRole(roleId);
    updateTag("roles");
}

export async function getRoleAction(roleId: number) {
    return getRoleById(roleId);
}

export async function deleteUserAction(userId: number) {
    const { deleteUser } = await import("@/db/services/users");
    await deleteUser(userId);
}
