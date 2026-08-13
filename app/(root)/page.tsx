import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getSiteSettings } from "@/lib/get-site-settings";
import SeoContentSection from "../_components/frontend/home/SeoContentSection";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, location } = await getSiteSettings();
  const area = location || "Biratnagar";

  return {
    title: "Order Food Online",
    description: `Order delicious meals from ${siteName} — ${area}'s cloud kitchen. Fast, fresh food delivery of burgers, pizza, momos, biryani and more to your door.`,
    keywords: [
      "order food online",
      "online food delivery",
      "cloud kitchen",
      "food delivery near me",
      "restaurant food delivery",
      "fast food delivery",
      "home delivery",
      `food delivery in ${area}`,
      "fresh meals",
    ],
  };
}

const ThreeDSlider = dynamic(() => import("../_components/frontend/home/3DSlider"));
const ThreeDVideoSlider = dynamic(() => import("../_components/frontend/home/3DVideoSlider"));
const HandShake = dynamic(() => import("../_components/frontend/home/HandShake"));
const HeroSection = dynamic(() => import("../_components/frontend/home/HeroSection"));
const VideoBurger = dynamic(() => import("../_components/frontend/home/VideoBurger"));
const PopularKitchen = dynamic(() => import("../_components/frontend/home/ourPopularKitchen"));
const OffersPopup = dynamic(() => import("../_components/frontend/OffersPopup"));

export default async function Home() {
  const { siteName, logo, contactPhone, location } = await getSiteSettings();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Restaurant",
        name: siteName,
        image: logo,
        servesCuisine: "Fast Food",
        priceRange: "$$",
        telephone: contactPhone,
        address: {
          "@type": "PostalAddress",
          addressLocality: location,
          addressCountry: "NP",
        },
        acceptsReservations: "False",
        hasMenu: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/menu`,
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/`,
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How do I order food online from " + siteName + "?",
            acceptedAnswer: {
              "@type": "Answer",
              text: `Visit the menu page, pick your favorite dishes, add them to your cart, and complete checkout. Your food is prepared fresh in our cloud kitchen and delivered to your door.`,
            },
          },
          {
            "@type": "Question",
            name: "What is a cloud kitchen?",
            acceptedAnswer: {
              "@type": "Answer",
              text: `A cloud kitchen is a professional cooking facility built exclusively for delivery and online ordering — no dine-in space. That means faster preparation and lower costs passed on to you.`,
            },
          },
          {
            "@type": "Question",
            name: "How fast is food delivery from " + siteName + "?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Most orders are delivered within 30 minutes, depending on your location and order size.",
            },
          },
          {
            "@type": "Question",
            name: "Where does " + siteName + " deliver?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "We deliver across the city and surrounding areas. Check the contact page for the full list of delivery zones.",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <HeroSection />
      <ThreeDSlider />
      <VideoBurger />
      <ThreeDVideoSlider />
      <HandShake />
      <SeoContentSection />
      <OffersPopup />
      <PopularKitchen />
    </>
  );
}
