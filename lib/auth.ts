import { randomBytes, scryptSync } from "crypto";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/auth";

import { db } from "@/db";
import { roles, users, type User as DbUser } from "@/db/schemas";

export async function getServerSession() {
  return auth();
}

export type UserWithRole = DbUser & { role: string };

export async function getCurrentUser(): Promise<UserWithRole | null> {
  const session = await getServerSession();
  if (!session?.user?.id) return null;
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      address: users.address,
      passwordHash: users.passwordHash,
      roleId: users.roleId,
      isGuest: users.isGuest,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      role: sql<string>`coalesce(${roles.name}, 'customer')`,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, session.user.id))
    .limit(1);
  return user ?? null;
}

export async function requireUser(): Promise<UserWithRole> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<UserWithRole> {
  const user = await requireUser();
  if (!["super-admin", "admin", "staff", "kitchen-manager", "payment-manager", "support-staff", "customer"].includes(user.role)) redirect("/dashboard");
  return user;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    redirect("/");
  }
  return user;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
