import type { Metadata } from "next";
import Menusearch from "./_components/Menusearch";
import MenuSidebar from "./_components/Menusidebar";
import { getSiteSettings } from "@/lib/get-site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, location } = await getSiteSettings();
  const area = location || "Biratnagar";

  return {
    title: "Menu",
    description: `Browse the ${siteName} menu — burgers, pizza, momos, biryani, healthy bowls, desserts and more. Order online for fast delivery in ${area}.`,
    keywords: [
      `${siteName} menu`,
      "online food menu",
      "order food online",
      "burger delivery",
      "pizza delivery",
      "momo delivery",
      "biryani delivery",
      "healthy food delivery",
      "dessert delivery",
      "fast food delivery",
      `food delivery in ${area}`,
      "best restaurant near me",
    ],
  };
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { siteName } = await getSiteSettings();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
                    { "@type": "ListItem", position: 2, name: "Menu", item: `${baseUrl}/menu` },
                ],
            },
            {
                "@type": "Menu",
                name: `${siteName} Menu`,
                description: `Order food online from ${siteName} — browse our menu and get meals delivered fast.`,
                url: `${baseUrl}/menu`,
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
                {/* <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                        {siteName} Menu — Order Food Online
                    </h1>
                    <p className="mt-2 text-gray-400 text-sm md:text-base">
                        Browse our full menu of fresh cloud kitchen meals. Pick
                        your favorites, order online, and get fast food delivery
                        to your doorstep.
                    </p>
                </div> */}
                <Menusearch />
                <main className="mt-3">
                    {children}
                </main>
            </div>
        </div>
    );
}
