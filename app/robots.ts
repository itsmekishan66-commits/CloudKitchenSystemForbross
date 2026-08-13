import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/checkout",
        "/success",
        "/unauthorized",
        "/dashboard",
        "/user",
        "/api",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

export const revalidate = 86400;
