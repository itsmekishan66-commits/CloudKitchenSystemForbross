import { NextResponse } from "next/server";

import { getUserByEmail } from "@/db/services";
import { setSession, verifyPassword } from "@/lib/auth";

type LoginPayload = {
  email?: string;
  password?: string;
  role?: "super-admin" | "admin" | "staff" | "customer";
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const payload = (await request.json()) as LoginPayload;
  const email = clean(payload.email).toLowerCase();
  const password = clean(payload.password);
  const expectedRole = payload.role;

  const user = email ? await getUserByEmail(email) : null;

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  if (
    expectedRole &&
    (expectedRole === "customer"
      ? user.role !== "customer"
      : !["super-admin", "admin", "staff"].includes(user.role))
  ) {
    return NextResponse.json(
      { error: "This account does not have access to that area" },
      { status: 403 },
    );
  }

  await setSession(user);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}
