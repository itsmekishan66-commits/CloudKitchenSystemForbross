import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schemas/users";
import { roles } from "@/db/schemas/roles";
import { rolePermissions } from "@/db/schemas/rolePermissions";
import { permissions } from "@/db/schemas/permissions";
import { and, eq } from "drizzle-orm";

// this is the code for assigning roles and permissions dynamically
// fetches user's permissions from DB via users → roles → role_permissions → permissions join
async function fetchUserPermissions(userId: number) {
    const result = await db.select({ permission: permissions.name }).from(users).leftJoin(roles, eq(users.roleId, roles.id)).leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId)).leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id)).where(and(eq(users.id, userId), eq(users.deleted, false)));

    return result.map((row) => row.permission).filter(Boolean) as string[];
}

export function getUserPermissions(userId: number) {
    const getCached = unstable_cache(
        () => fetchUserPermissions(userId),
        [`user-permissions-${userId}`],
        { revalidate: 30, tags: ["user-permissions"] }
    );
    return getCached();
}
