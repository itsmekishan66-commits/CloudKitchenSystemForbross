"use server";

// this is the code for assigning roles and permissions dynamicall// creates a new role + user with that role in DB
import { createRole } from "@/db/services/roles";
import { assignPermissionsForRole } from "@/db/services/permissions";
import { createUser } from "@/db/services/users";
import { hashPassword } from "@/lib/auth";
import { db } from "@/db";
import { permissions } from "@/db/schemas";
import { inArray } from "drizzle-orm";

export async function createRoleWithPermissionsAction(
    name: string,
    permissionNames: string[],
    userData: { userName: string; userEmail: string; userPhone: string; userAddress: string; userPassword: string }
) {
    // create role
    const roleId = await createRole(name, `${name} role`);

    // get permissions IDs from names
    const permissionRows = await db.select({ id: permissions.id }).from(permissions).where(
        inArray(permissions.name, permissionNames));

    const permissionsIds = permissionRows.map((p) => p.id);

    // assign permissions to role
    await assignPermissionsForRole(roleId, permissionsIds);

    // create user with this role
    const passwordHash = userData.userPassword ? await hashPassword(userData.userPassword) : null;
    await createUser({
        name: userData.userName,
        email: userData.userEmail || null,
        phone: userData.userPhone || null,
        address: userData.userAddress || null,
        passwordHash,
        roleId,
    });

    return roleId;
}

export async function getRolePermissionsAction(roleId: number) {
    const { getPermissionsForRole } = await import("@/db/services/permissions");
    const rows = await getPermissionsForRole(roleId);
    return rows.map((r) => r.name);
}

export async function updateRolePermissionsAction(roleId: number, permissionNames: string[]) {
    const permissionRows = await db.select({ id: permissions.id }).from(permissions).where(
        inArray(permissions.name, permissionNames));
    const permissionsIds = permissionRows.map((p) => p.id);
    await assignPermissionsForRole(roleId, permissionsIds);
}

export async function deleteUserAction(userId: number) {
    const { deleteUser } = await import("@/db/services/users");
    await deleteUser(userId);
}
