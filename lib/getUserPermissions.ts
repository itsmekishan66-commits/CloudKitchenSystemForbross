import { db } from "@/db";
import { users } from "@/db/schemas/users";
import { roles } from "@/db/schemas/roles";
import { rolePermissions } from "@/db/schemas/rolePermissions";
import { permissions } from "@/db/schemas/permissions";
import { eq } from "drizzle-orm";

// this is the code for assigning roles and permissions dynamically
// fetches user's permissions from DB via users → roles → role_permissions → permissions join
export async function getUserPermissions(userId: number) {
    const result = await db.select({ permission: permissions.name }).from(users).leftJoin(roles, eq(users.roleId, roles.id)).leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId)).leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id)).where(eq(users.id, userId));

    return result.map((row) => row.permission).filter(Boolean) as string[];
}
