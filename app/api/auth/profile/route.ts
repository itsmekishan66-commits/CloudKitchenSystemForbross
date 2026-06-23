import { NextResponse } from "next/server";

import { updateUser } from "@/db/services";
import { getCurrentUser, requireUser } from "@/lib/auth";

type ProfilePayload = {
  name?: string;
  phone?: string;
  address?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role },
  });
}

export async function PATCH(request: Request) {
  const user = await requireUser();
  const payload = (await request.json()) as ProfilePayload;
  const name = clean(payload.name);
  const phone = clean(payload.phone);
  const address = clean(payload.address);

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  await updateUser(user.id, {
    name,
    phone: phone || null,
    address: address || null,
  });

  return NextResponse.json({ ok: true });
}
