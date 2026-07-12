import { NextResponse } from "next/server";
import { getUserByEmail } from "@/db/services/users";
import { findValidToken, markTokenUsed } from "@/db/services/password-reset-tokens";
import { updateUserPassword } from "@/db/services/users";
import { hashPassword } from "@/lib/auth";
import { rateLimit, getClientIdentifier } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const limit = rateLimit(getClientIdentifier(request, "reset-password"), {
      windowMs: 15 * 60 * 1000,
      max: 5,
    });
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const record = await findValidToken(token);
    if (!record) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    const user = await getUserByEmail(record.email);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const passwordHash = hashPassword(password);
    await updateUserPassword(user.id, passwordHash);
    await markTokenUsed(record.id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}