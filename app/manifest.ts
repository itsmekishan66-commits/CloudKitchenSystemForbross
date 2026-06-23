import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/get-site-settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { siteName } = await getSiteSettings();

  return {
    name: siteName,
    short_name: siteName,
    description: "Fresh meals from a cloud kitchen delivered fast.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7f1d1d",
  };
}
