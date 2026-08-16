import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { getMenuItems } from "@/db/services/menu-items";
import { getCategoriesByType } from "@/db/services/categories";
import MenuContent, { type AddonItem, type ApiMenuItem } from "./MenuContent";

const getMenuPageData = unstable_cache(
  async () => {
    const [allItems, cats] = await Promise.all([
      getMenuItems(),
      getCategoriesByType("menu"),
    ]);
    return { allItems, cats };
  },
  ["menu-page"],
  { revalidate: 300, tags: ["menu-items", "categories"] }
);

export default async function MenuPage() {
  const { allItems, cats } = await getMenuPageData();

  const items: ApiMenuItem[] = allItems.map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    title: item.title,
    slug: item.slug,
    image: item.image,
    description: item.description,
    price: item.price,
    badge: item.badge,
    rating: item.rating,
    reviews: item.reviews,
    isAvailable: item.isAvailable,
    addons: (item.addons as AddonItem[] | null) ?? null,
    discountPercent: item.discountPercent,
  }));

  const categoryMap: Record<number, string> = {};
  for (const cat of cats) {
    categoryMap[cat.id] = cat.slug;
  }

  return (
    <main className="bg-black min-h-screen">
      <Suspense fallback={
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="h-8 w-48 bg-gray-700 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-gray-600 rounded mt-2 animate-pulse" />
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="h-52 bg-gray-700 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-3/4 bg-gray-600 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-600 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      }>
        <div className="py-2 px-1">
          <MenuContent items={items} categoryMap={categoryMap} />
        </div>
      </Suspense>
    </main>
  );
}