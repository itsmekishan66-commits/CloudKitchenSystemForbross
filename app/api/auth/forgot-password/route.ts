import { NextResponse } from "next/server";
import { getUserByEmail } from "@/db/services/users";
import { createResetToken } from "@/db/services/password-reset-tokens";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
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