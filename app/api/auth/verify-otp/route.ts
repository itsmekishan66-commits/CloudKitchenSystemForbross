import { NextResponse } from "next/server";
import { createUser, findAndDeletePendingRegistration } from "@/db/services";
import { rateLimit, getClientIdentifier } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const limit = rateLimit(getClientIdentifier(request, "verify-otp"), {
      windowMs: 10 * 60 * 1000,
      max: 10,
    });
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const pending = await findAndDeletePendingRegistration(email.toLowerCase().trim(), otp.trim());

    if (!pending) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    await createUser({
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      address: pending.address,
      passwordHash: pending.passwordHash,
      roleId: pending.roleId ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("OTP verification failed", error);
    return NextResponse.json({ error: "Unable to verify OTP" }, { status: 500 });
  }
}
