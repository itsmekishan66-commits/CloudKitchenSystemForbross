import "server-only";

import { getSiteSettings as getSiteSettingsFromDb } from "@/db/services/site-settings";
import { DEFAULT_ABOUT_CONTENT, DEFAULT_CONTACT_CONTENT } from "./site-defaults";

export async function getSiteSettings() {
  const settings = await getSiteSettingsFromDb();

  return {
    siteName: settings?.siteName ?? "Cloud Kitchen",
    logo: settings?.logo ?? null,
    contactEmail: settings?.contactEmail ?? "",
    contactPhone: settings?.contactPhone ?? "",
    location: settings?.location ?? "",
    aboutContent: settings?.aboutContent ?? DEFAULT_ABOUT_CONTENT,
    contactContent: settings?.contactContent ?? DEFAULT_CONTACT_CONTENT,
  };
}
