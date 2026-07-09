import { randomBytes } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens } from "@/db/schemas";

export async function createResetToken(email: string) {
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.email, email));

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  const result = await db
    .insert(passwordResetTokens)
    .values({ email, token, expiresAt });

  return { id: result[0].insertId, token, expiresAt };
}

export async function findValidToken(token: string) {
  const [record] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return record ?? null;
}

export async function markTokenUsed(id: number) {
  await db
    .update(passwordResetTokens)
    .set({ used: true })
    .where(eq(passwordResetTokens.id, id));
}