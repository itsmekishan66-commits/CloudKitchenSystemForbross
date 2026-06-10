import { NextResponse } from "next/server";

import { sendContactMessage } from "@/lib/email";

type ContactPayload = {
  email?: string;
  message?: string;
  name?: string;
  phone?: string;
  subject?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = clean(payload.name);
  const email = clean(payload.email).toLowerCase();
  const phone = clean(payload.phone);
  const subject = clean(payload.subject) || "Website enquiry";
  const message = clean(payload.message);

  if (!name || !email || !message || !email.includes("@")) {
    return NextResponse.json(
      { error: "Name, valid email, and message are required" },
      { status: 400 },
    );
  }

  try {
    await sendContactMessage({
      name,
      email,
      phone,
      subject,
      message,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to send contact message", error);
    return NextResponse.json(
      { error: "Unable to send your message right now" },
      { status: 500 },
    );
  }
}
