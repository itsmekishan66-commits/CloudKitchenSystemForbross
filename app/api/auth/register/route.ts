import { NextResponse } from "next/server";

import { createUser, getRoleIdByName, getUserByEmail } from "@/db/services";
import { hashPassword } from "@/lib/auth";

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

  const existing = await getUserByEmail(email);

  if (existing) {
    return NextResponse.json(
      { error: "An account already exists for this email" },
      { status: 409 },
    );
  }

  const roleId = await getRoleIdByName(role);

  const userId = await createUser({
    name,
    email,
    phone: phone || null,
    address: address || null,
    passwordHash: hashPassword(password),
    roleId: roleId ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
