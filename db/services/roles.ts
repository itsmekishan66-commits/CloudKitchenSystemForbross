import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { rolePermissions, roles, users } from "@/db/schemas";

export async function getRoles() {
  return db
    .select()
    .from(roles)
    .orderBy(asc(roles.name));
}

export async function createRole(name: string, description?: string) {
  const result = await db.insert(roles).values({ name, description });
  return result[0].insertId;
}

export async function updateRole(id: number, name: string, description?: string) {
  await db.update(roles).set({ name, description, updatedAt: new Date() }).where(eq(roles.id, id));
}

export async function deleteRole(id: number) {
  await db.transaction(async (tx) => {
    // Remove permission assignments before deleting the role
    // (role_permissions.role_id has a FK constraint on roles.id)
    await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));

    // Block deletion while users are still assigned to the role
    const assignedUsers = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.roleId, id))
      .limit(1);

    if (assignedUsers.length > 0) {
      throw new Error("Cannot delete a role that is still assigned to users.");
    }

    await tx.delete(roles).where(eq(roles.id, id));
  });
}

export async function getRoleById(id: number) {
  const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  return role ?? null;
}