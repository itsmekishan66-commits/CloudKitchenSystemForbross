import { db } from "@/db";
import { roles } from "@/db/schemas/roles";
import { users } from "@/db/schemas/users";
import { and, eq } from "drizzle-orm";

export async function getUserRole(userId: number) {
    const result = await db.select({ role: roles.name }).from(users).leftJoin(roles, eq(users.roleId, roles.id)).where(and(eq(users.id, userId), eq(users.deleted, false))).limit(1);
    return result[0]?.role || null;
}

