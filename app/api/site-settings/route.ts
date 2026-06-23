import { NextResponse } from "next/server";
import { getSiteSettings } from "@/db/services/site-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let settings = await getSiteSettings();

    if (!settings) {
      settings = {
        id: 0,
        siteName: "Cloud Kitchen",
        logo: null,
        contactEmail: null,
        contactPhone: null,
        location: null,
        aboutContent: null,
        contactContent: null,
        updatedAt: new Date(),
      };
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to load site settings", error);
    return NextResponse.json({ error: "Unable to load site settings" }, { status: 500 });
  }
}
