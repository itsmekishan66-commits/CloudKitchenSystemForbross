import { NextResponse } from "next/server";

import { updateUser } from "@/db/services";
import { requireUser } from "@/lib/auth";

type ProfilePayload = {
  name?: string;
  phone?: string;
  address?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
