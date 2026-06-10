import "./globals.css";

import type { Metadata } from "next";

import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { CartProvider } from "./context/CartContext";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Mama's Kitchen | Cloud Kitchen Delivery",
    template: "%s | Mama's Kitchen",
  },
  description:
    "Fresh meals prepared in Mama's Kitchen and delivered fast to your door.",
  openGraph: {
    title: "Mama's Kitchen",
    description:
      "Fresh cloud kitchen meals prepared daily and delivered fast.",
    url: "/",
    siteName: "Mama's Kitchen",
    images: [
      {
        url: "/images/hero-bg.png",
        width: 1200,
        height: 630,
        alt: "Mama's Kitchen featured meal",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mama's Kitchen",
    description:
      "Fresh cloud kitchen meals prepared daily and delivered fast.",
    images: ["/images/hero-bg.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Navbar />
          {children}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
