import { db } from "@/db";
import { roles } from "@/db/schemas/roles";
import { users } from "@/db/schemas/users";
import { eq } from "drizzle-orm";

export async function getUserRole(userId: number) {
    const result = await db.select({ role: roles.name }).from(users).leftJoin(roles, eq(users.roleId, roles.id)).where(eq(users.id, userId)).limit(1);
    return result[0]?.role || null;
}

