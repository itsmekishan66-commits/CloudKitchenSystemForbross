import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { pendingRegistrations } from "@/db/schemas";

export async function createPendingRegistration(data: {
  email: string;
  name: string;
  phone: string | null;
  address: string | null;
  passwordHash: string;
  roleId: number | null;
  otp: string;
  expiresAt: Date;
}) {
  const result = await db.insert(pendingRegistrations).values(data);
  return result[0].insertId;
}

export async function findAndDeletePendingRegistration(email: string, otp: string) {
  const [record] = await db
    .select()
    .from(pendingRegistrations)
    .where(
      and(
        eq(pendingRegistrations.email, email),
        eq(pendingRegistrations.otp, otp),
        gt(pendingRegistrations.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!record) return null;

  await db
    .delete(pendingRegistrations)
    .where(eq(pendingRegistrations.id, record.id));

  return record;
}

export async function deleteExpiredPendingRegistrations() {
  await db
    .delete(pendingRegistrations)
    .where(gt(pendingRegistrations.expiresAt, new Date()));
}
