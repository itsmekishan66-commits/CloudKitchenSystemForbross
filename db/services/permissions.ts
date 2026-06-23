import { db } from "@/db";
import { eq } from "drizzle-orm";
import { permissions, rolePermissions } from "@/db/schemas";

export async function getPermissions() {
    return db.select().from(permissions);

}

export async function getPermissionsForRole(roleId: number) {
    return db.select({ id: permissions.id, name: permissions.name, description: permissions.description })
        .from(rolePermissions).innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id),)
        .where(eq(rolePermissions.roleId, roleId));
}

export async function assignPermissionsForRole(roleId: number, permissionIds: number[]) {
    // delete old permissions
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

    // insert new permissions
    if (permissionIds.length > 0) {
        await db.insert(rolePermissions).values(permissionIds.map((permissionId) => ({ roleId, permissionId })));
    }
}

export async function roleHasPermission(roleId: number, permissionName: string) {
    const result = await db.select({ permissionId: rolePermissions.permissionId })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, roleId));
    console.log(result);

    return result.some((per) => per.permissionId && permissionName);
}
