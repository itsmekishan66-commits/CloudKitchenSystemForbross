import { and, asc, eq, gte, ne } from "drizzle-orm";
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
    .where(and(eq(users.id, id), eq(users.deleted, false)))
    .limit(1);
  return user ?? null;
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.deleted, false)))
    .limit(1);
  return user ?? null;
}

export async function getUserByEmailIncludingDeleted(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user ?? null;
}

// getUsers returns all non-deleted users with their role name.
// Use options to filter at DB level: { excludeRole: "customer", excludeGuests: true }
export async function getUsers(options?: { excludeRole?: string; excludeGuests?: boolean }) {
  const filters = [eq(users.deleted, false)];

  if (options?.excludeRole) {
    filters.push(ne(roles.name, options.excludeRole));
  }
  if (options?.excludeGuests) {
    filters.push(eq(users.isGuest, false));
  }

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
    .where(and(...filters))
    .orderBy(asc(users.name));
  return result;
}

export async function createUser(user: NewUser) {
  const result = await db.insert(users).values(user);
  return result[0].insertId;
}

export async function updateUserPassword(id: number, passwordHash: string) {
  await db.update(users).set({ passwordHash }).where(eq(users.id, id));
}

export async function updateUser(
  id: number,
  user: Partial<Omit<NewUser, "id" | "passwordHash" | "roleId">>,
) {
  await db.update(users).set(user).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  await db.update(users).set({ deleted: true }).where(eq(users.id, id));
}

export async function setUserOtp(
  id: number,
  otp: string,
  expires: Date,
) {
  await db
    .update(users)
    .set({ verificationOtp: otp, verificationOtpExpires: expires })
    .where(eq(users.id, id));
}

export async function verifyUserOtp(email: string, otp: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.email, email),
        eq(users.verificationOtp, otp),
        gte(users.verificationOtpExpires, new Date()),
      ),
    )
    .limit(1);

  if (!user) return null;

  await db
    .update(users)
    .set({
      emailVerified: true,
      verificationOtp: null,
      verificationOtpExpires: null,
    })
    .where(eq(users.id, user.id));

  return user;
}
