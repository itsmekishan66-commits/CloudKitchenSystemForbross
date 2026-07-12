import { NextResponse } from "next/server";
import { randomInt } from "crypto";

import { db } from "@/db";
import { getRoleIdByName, getUserByEmailIncludingDeleted, createPendingRegistration } from "@/db/services";
import { pendingRegistrations } from "@/db/schemas";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";
import { rateLimit, getClientIdentifier } from "@/lib/rateLimit";

type RegisterPayload = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  password?: string;
  role?: "super-admin" | "admin" | "staff" | "customer";
  inviteCode?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const limit = rateLimit(getClientIdentifier(request, "register"), {
    windowMs: 10 * 60 * 1000,
    max: 5,
  });
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const payload = (await request.json()) as RegisterPayload;
  const name = clean(payload.name);
  const email = clean(payload.email).toLowerCase();
  const phone = clean(payload.phone);
  const address = clean(payload.address);
  const password = clean(payload.password);
  const role = payload.role === "admin" ? "admin" : "customer";

  if (!name || !email || password.length < 8) {
    return NextResponse.json(
      { error: "Name, email, and an 8 character password are required" },
      { status: 400 },
    );
  }

  if (role === "admin") {
    const inviteCode = process.env.ADMIN_INVITE_CODE;

    if (!inviteCode || clean(payload.inviteCode) !== inviteCode) {
      return NextResponse.json(
        { error: "A valid admin invite code is required" },
        { status: 403 },
      );
    }
  }

  const existingUser = await getUserByEmailIncludingDeleted(email);
  if (existingUser) {
    return NextResponse.json(
      { error: "An account already exists for this email" },
      { status: 409 },
    );
  }

  const [existingPending] = await db
    .select({ id: pendingRegistrations.id })
    .from(pendingRegistrations)
    .where(eq(pendingRegistrations.email, email))
    .limit(1);

  if (existingPending) {
    await db.delete(pendingRegistrations).where(eq(pendingRegistrations.id, existingPending.id));
  }

  const roleId = await getRoleIdByName(role);
  const passwordHash = hashPassword(password);
  const otp = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await createPendingRegistration({
    email,
    name,
    phone: phone || null,
    address: address || null,
    passwordHash,
    roleId,
    otp,
    expiresAt,
  });

  try {
    await sendOtpEmail(name, email, otp);
  } catch (err) {
    console.error("Failed to send OTP email", err);
    return NextResponse.json({ error: "Failed to send verification email. Check SMTP settings." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, requiresOtp: true });
}
