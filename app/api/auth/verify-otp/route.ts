import { NextResponse } from "next/server";
import { createUser, findAndDeletePendingRegistration } from "@/db/services";

export async function POST(request: Request) {
  try {
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
