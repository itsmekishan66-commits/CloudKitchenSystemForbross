import "server-only";

import { unstable_cache } from "next/cache";
import { getFilteredMenuItems } from "@/db/services/menu-items";
import { getCategoriesByType } from "@/db/services/categories";

async function fetchMenuSeo() {
  const [items, categories] = await Promise.all([
    getFilteredMenuItems(),
    getCategoriesByType("menu"),
  ]);

  return { items, categories };
}

export function getMenuSeo() {
  const getCached = unstable_cache(
    fetchMenuSeo,
    ["menu-seo"],
    { revalidate: 300, tags: ["menu-items", "categories"] }
  );
  return getCached();
}

export function absoluteImageUrl(src: string | null, baseUrl: string): string | null {
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${baseUrl}${src.startsWith("/") ? src : `/${src}`}`;
}