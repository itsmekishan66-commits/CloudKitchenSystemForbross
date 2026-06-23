import { NextResponse } from "next/server";

import { sendContactMessage } from "@/lib/email";
import { createContactMessage } from "@/db/services/contact-messages";

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
    await createContactMessage({ name, email, phone, subject, message, source: "contact" });

    // Email is best-effort; don't block the response if it fails
    sendContactMessage({ name, email, phone, subject, message }).catch((err) =>
      console.error("Email send failed (non-blocking)", err),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save contact message", error);
    return NextResponse.json(
      { error: "Unable to send your message right now" },
      { status: 500 },
    );
  }
}
