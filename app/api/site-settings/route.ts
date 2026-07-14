import { NextResponse } from "next/server";
import { getSiteSettings } from "@/db/services/site-settings";
import { cacheHeaders } from "@/lib/apiCache";

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
        homeVideoBurger: null,
        home3dSliderVideos: null,
        updatedAt: new Date(),
      };
    }

    return NextResponse.json(settings, { headers: cacheHeaders() });
  } catch (error) {
    console.error("Failed to load site settings", error);
    return NextResponse.json({ error: "Unable to load site settings" }, { status: 500 });
  }
}
