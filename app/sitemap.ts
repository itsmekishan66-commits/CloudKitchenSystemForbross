import type { MetadataRoute } from "next";
import { getMenuSeo } from "@/lib/get-menu-seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const routes = [
    { path: "", priority: 1 },
    { path: "/menu", priority: 0.9 },
    { path: "/about", priority: 0.7 },
    { path: "/contact", priority: 0.7 },
  ];

  const staticRoutes = routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route.priority,
  }));

  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const { categories } = await getMenuSeo();
    categoryRoutes = categories.map((category) => ({
      url: `${baseUrl}/menu?category=${category.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (err) {
    console.error("Failed to load categories for sitemap", err);
  }

  return [...staticRoutes, ...categoryRoutes];
}