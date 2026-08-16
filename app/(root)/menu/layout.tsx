import type { Metadata } from "next";
import Menusearch from "./_components/Menusearch";
import MenuSidebar from "./_components/Menusidebar";
import { getSiteSettings } from "@/lib/get-site-settings";
import { getMenuSeo, absoluteImageUrl } from "@/lib/get-menu-seo";

const CURRENCY = "NPR";
const PAGE_URL = "/menu";

export async function generateMetadata(): Promise<Metadata> {
    const [{ siteName, location }, { items, categories }] = await Promise.all([
        getSiteSettings(),
        getMenuSeo(),
    ]);
    const area = location || "Biratnagar";
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const categoryNames = categories.map((c) => c.name);
    const dishNames = items.slice(0, 8).map((i) => i.title);

    const description = `Browse the ${siteName} menu — ${categoryNames.join(", ") || "burgers, pizza, momos, biryani, healthy bowls, desserts and more"}. ${items.length} items available. Order online for fast delivery in ${area}.`;

    return {
        title: `${siteName} Menu — Order Food Online in ${area}`,
        description,
        keywords: [
            `${siteName} menu`,
            ...categoryNames.map((c) => `${c.toLowerCase()} delivery`),
            ...dishNames.map((d) => `${d} delivery`),
            "online food menu",
            "order food online",
            "best restaurant near me",
            `food delivery in ${area}`,
            "fast food delivery",
            "healthy food delivery",
            "burger delivery",
            "pizza delivery",
            "momo delivery",
            "biryani delivery",
            "healthy food delivery",
            "dessert delivery",
            "fast food delivery",
        ],
        alternates: {
            canonical: `${baseUrl}${PAGE_URL}`,
        },
openGraph: {
      title: `${siteName} Menu — Order Food Online in ${area}`,
      description,
      type: "website",
      url: `${baseUrl}${PAGE_URL}`,
      siteName,
      images: [
        {
          url: `${baseUrl}${PAGE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${siteName} Menu — Order Food Online`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} Menu — Order Food Online in ${area}`,
      description,
      images: [`${baseUrl}${PAGE_URL}/opengraph-image`],
    },
    };
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { siteName, location } = await getSiteSettings();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const area = location || "Biratnagar";

    let items: Awaited<ReturnType<typeof getMenuSeo>>["items"] = [];
    let categories: Awaited<ReturnType<typeof getMenuSeo>>["categories"] = [];
    try {
        const seo = await getMenuSeo();
        items = seo.items;
        categories = seo.categories;
    } catch (err) {
        console.error("Failed to load menu SEO data", err);
    }

    const menuSections = categories.map((category) => {
        const categoryItems = items.filter((i) => i.categoryId === category.id);
        return {
            "@type": "MenuSection",
            name: category.name,
            url: `${baseUrl}${PAGE_URL}?category=${category.slug}`,
            hasMenuItem: categoryItems.map((item) => {
                const offers: Record<string, unknown> = {
                    "@type": "Offer",
                    price: Number(item.price),
                    priceCurrency: CURRENCY,
                    url: `${baseUrl}${PAGE_URL}`,
                    availability: "https://schema.org/InStock",
                };
                const image = absoluteImageUrl(item.image, baseUrl);
                return {
                    "@type": "MenuItem",
                    name: item.title,
                    description: item.description || undefined,
                    image: image || undefined,
                    offers,
                    ...(Number(item.rating) > 0
                        ? {
                            aggregateRating: {
                                "@type": "AggregateRating",
                                ratingValue: Number(item.rating),
                                reviewCount: item.reviews,
                            },
                        }
                        : {}),
                };
            }),
        };
    });

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
                    { "@type": "ListItem", position: 2, name: "Menu", item: `${baseUrl}${PAGE_URL}` },
                ],
            },
            {
                "@type": "Restaurant",
                name: siteName,
                url: baseUrl,
                servesCuisine: categories.map((c) => c.name),
                areaServed: area,
                menu: `${baseUrl}${PAGE_URL}`,
                hasMenu: {
                    "@type": "Menu",
                    name: `${siteName} Menu`,
                    description: `Order food online from ${siteName} — browse our menu and get meals delivered fast in ${area}.`,
                    url: `${baseUrl}${PAGE_URL}`,
                    hasMenuSection: menuSections,
                },
            },
        ],
    };

    return (
        <div className="flex min-h-screen bg-black">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
                }}
            />
            <MenuSidebar />
            <div className="flex-1 p-4 md:p-8 pt-24">
                <Menusearch />
                <main className="mt-3">
                    {children}
                </main>
            </div>
        </div>
    );
}