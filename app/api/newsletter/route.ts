import { NextResponse } from "next/server";
import { createContactMessage } from "@/db/services/contact-messages";

export async function POST(request: Request) {
  let payload: { email?: string };

  try {
    payload = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = (payload.email || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "A valid email is required" },
      { status: 400 },
    );
  }

  try {
    await createContactMessage({ email, source: "newsletter" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to subscribe to newsletter", error);
    return NextResponse.json(
      { error: "Unable to subscribe right now" },
      { status: 500 },
    );
  }
}
