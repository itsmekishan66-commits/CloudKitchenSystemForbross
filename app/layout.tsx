import "./globals.css";

import type { Metadata } from "next";
import Providers from "./providers";
import { getSiteSettings } from "@/lib/get-site-settings";
import { auth } from "@/auth";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, location } = await getSiteSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const area = location || "Biratnagar";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${siteName} | Cloud Kitchen Delivery in ${area}`,
      template: `%s | ${siteName}`,
    },
    description:
      `Order fresh, hot meals from ${siteName} — ${area}'s cloud kitchen. Fast food delivery of burgers, pizza, momos, biryani and more, delivered to your door.`,
    keywords: [
      siteName,
      "cloud kitchen",
      `${siteName} ${area}`,
      "food delivery",
      `food delivery in ${area}`,
      "online food order",
      "order food online",
      "restaurant food delivery",
      "home food delivery",
      "fast food delivery",
      "fresh meals delivered",
      "meal delivery service",
      "cloud kitchen near me",
    ],
    authors: [{ name: siteName }],
    category: "food",
    openGraph: {
      title: `${siteName} | Cloud Kitchen Delivery`,
      description:
        "Fresh cloud kitchen meals prepared daily and delivered fast. Order online for quick delivery.",
      url: "/",
      siteName: siteName,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} | Cloud Kitchen Delivery`,
      description:
        "Fresh cloud kitchen meals prepared daily and delivered fast.",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
