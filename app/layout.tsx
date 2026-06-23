import "./globals.css";

import type { Metadata } from "next";
import Providers from "./providers";
import { getSiteSettings } from "@/lib/get-site-settings";
import { auth } from "@/auth";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, logo } = await getSiteSettings();

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
    title: {
      default: `${siteName} | Cloud Kitchen Delivery`,
      template: `%s | ${siteName}`,
    },
    description:
      `Fresh meals prepared in ${siteName} and delivered fast to your door.`,
    openGraph: {
      title: siteName,
      description:
        "Fresh cloud kitchen meals prepared daily and delivered fast.",
      url: "/",
      siteName: siteName,
      images: logo
        ? [{ url: logo, width: 1200, height: 630, alt: `${siteName} featured meal` }]
        : [{ url: "/images/hero-bg.png", width: 1200, height: 630, alt: `${siteName} featured meal` }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description:
        "Fresh cloud kitchen meals prepared daily and delivered fast.",
      images: logo ? [logo] : ["/images/hero-bg.png"],
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
