import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { roles, users, type NewUser } from "@/db/schemas";

export async function getRoleIdByName(name: string) {
  const [role] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, name))
    .limit(1);
  return role?.id ?? null;
}

export async function getUserById(id: number) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user ?? null;
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user ?? null;
}

export async function getUsers() {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      address: users.address,
      roleId: users.roleId,
      isGuest: users.isGuest,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      role: roles.name,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .orderBy(asc(users.name));
  return result;
}

export async function createUser(user: NewUser) {
  const result = await db.insert(users).values(user);
  return result[0].insertId;
}

export async function updateUser(
  id: number,
  user: Partial<Omit<NewUser, "id" | "passwordHash" | "roleId">>,
) {
  await db.update(users).set(user).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  await db.delete(users).where(eq(users.id, id));
}
