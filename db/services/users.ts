import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { users, type NewUser } from "@/db/schemas";

export async function getUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
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
  return db.select().from(users).orderBy(asc(users.name));
}

export async function createUser(user: NewUser) {
  const result = await db.insert(users).values(user);
  return result[0].insertId;
}

export async function updateUser(
  id: number,
  user: Partial<Omit<NewUser, "id" | "passwordHash" | "role">>,
) {
  await db.update(users).set(user).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  await db.delete(users).where(eq(users.id, id));
}
