import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mama's Kitchen",
    short_name: "Mama's Kitchen",
    description: "Fresh meals from a cloud kitchen delivered fast.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7f1d1d",
  };
}
