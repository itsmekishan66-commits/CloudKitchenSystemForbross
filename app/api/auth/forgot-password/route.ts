import { NextResponse } from "next/server";
import { getUserByEmail } from "@/db/services/users";
import { createResetToken } from "@/db/services/password-reset-tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, getClientIdentifier } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const limit = rateLimit(getClientIdentifier(request, "forgot-password"), {
      windowMs: 15 * 60 * 1000,
      max: 5,
    });
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await getUserByEmail(normalizedEmail);

    if (user) {
      const { token } = await createResetToken(normalizedEmail);
      await sendPasswordResetEmail(user.name, normalizedEmail, token);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}