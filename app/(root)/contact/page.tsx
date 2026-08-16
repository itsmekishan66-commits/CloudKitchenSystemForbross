import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
} from "react-icons/fa";
import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/get-site-settings";
import ContactForm from "./ContactForm";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, location } = await getSiteSettings();
  const area = location || "Biratnagar";

  return {
    title: "Contact Us",
    description: `Contact ${siteName} — order questions, feedback, or partnerships. ${area}'s cloud kitchen delivery.`,
    keywords: [
      `contact ${siteName}`,
      "food delivery contact",
      "order food online",
      "cloud kitchen delivery",
      "food delivery phone number",
      `food delivery in ${area}`,
      "cloud kitchen near me",
      "online food ordering",
    ],
    openGraph: {
      title: `Contact ${siteName}`,
      description: `Get in touch with ${siteName} — order questions, feedback, or partnership inquiries.`,
    },
  };
}

export default async function ContactPage() {
  const { siteName, contactEmail, contactPhone, location, contactContent } = await getSiteSettings();

  const c = (contactContent as Record<string, unknown>) || {};
  const heroHeading = (c.heroHeading as string) || "We'd Love To";
  const heroHeadingAccent = (c.heroHeadingAccent as string) || "Hear From You";
  const heroDescription =
    (c.heroDescription as string) ||
    "Questions about your order, partnership opportunities, or feedback? Our team is ready to help.";
  const deliveryAreas = (c.deliveryAreas as string[]) || [];
  const hoursWeekday = (c.hoursWeekday as string) || "9:00 AM - 11:00 PM";
  const hoursSaturday = (c.hoursSaturday as string) || "10:00 AM - 11:00 PM";
  const hoursSunday = (c.hoursSunday as string) || "10:00 AM - 10:00 PM";
  const mapEmbedUrl = (c.mapEmbedUrl as string) || "";
  const ctaTitle = (c.ctaTitle as string) || "Hungry Right Now?";
  const ctaDescription =
    (c.ctaDescription as string) ||
    "Browse our menu and get delicious meals delivered to your doorstep in minutes.";
  const ctaButtonText = (c.ctaButtonText as string) || "Order Now";

  const displayEmail = contactEmail || "hello@example.com";
  const displayPhone = contactPhone || "+977 9800000000";
  const displayLocation = location || "Biratnagar, Nepal";

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <main className="bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
                  { "@type": "ListItem", position: 2, name: "Contact", item: `${baseUrl}/contact` },
                ],
              },
              {
                "@type": "ContactPage",
                name: `${siteName} | Contact Us`,
                description: heroDescription,
                mainEntity: {
                  "@type": "Organization",
                  name: siteName,
                  telephone: displayPhone,
                  email: displayEmail,
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: displayLocation,
                    addressCountry: "NP",
                  },
                },
              },
            ],
          }).replace(/</g, "\\u003c"),
        }}
      />

      {/* Hero */}
      <section className="bg-linear-to-br from-gray-900 via-black to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-18 text-center">

          <h1 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-bold text-white">
            {heroHeading}
            <span className="text-red-500 block">
              {heroHeadingAccent}
            </span>
          </h1>

          <p className="max-w-2xl mx-auto mt-6 text-gray-400 text-sm sm:text-lg px-2 sm:px-0">
            {heroDescription}
          </p>

        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

            <div className="bg-gray-800 shadow-lg rounded-3xl p-6 sm:p-8 text-center hover:-translate-y-1 transition border border-gray-700">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-gray-700 flex items-center justify-center text-orange-400 text-lg sm:text-xl">
                <FaPhoneAlt />
              </div>
              <h3 className="font-bold text-lg sm:text-xl mt-5 text-white">Phone</h3>
              <p className="text-gray-400 mt-2 text-sm sm:text-base break-all">{displayPhone}</p>
            </div>

            <div className="bg-gray-800 shadow-lg rounded-3xl p-6 sm:p-8 text-center hover:-translate-y-1 transition border border-gray-700">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-gray-700 flex items-center justify-center text-orange-400 text-lg sm:text-xl">
                <FaEnvelope />
              </div>
              <h3 className="font-bold text-lg sm:text-xl mt-5 text-white">Email</h3>
              <p className="text-gray-400 mt-2 text-sm sm:text-base break-all">{displayEmail}</p>
            </div>

            <div className="bg-gray-800 shadow-lg rounded-3xl p-6 sm:p-8 text-center hover:-translate-y-1 transition border border-gray-700">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-gray-700 flex items-center justify-center text-orange-400 text-lg sm:text-xl">
                <FaMapMarkerAlt />
              </div>
              <h3 className="font-bold text-lg sm:text-xl mt-5 text-white">Location</h3>
              <p className="text-gray-400 mt-2 text-sm sm:text-base">{displayLocation}</p>
            </div>

            <div className="bg-gray-800 shadow-lg rounded-3xl p-6 sm:p-8 text-center hover:-translate-y-1 transition border border-gray-700">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-gray-700 flex items-center justify-center text-orange-400 text-lg sm:text-xl">
                <FaClock />
              </div>
              <h3 className="font-bold text-lg sm:text-xl mt-5 text-white">Open Hours</h3>
              <p className="text-gray-400 mt-2 text-sm sm:text-base">{hoursWeekday}</p>
            </div>

          </div>

        </div>
      </section>

      {/* Form + Info */}
      <section className="pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12">

            {/* Contact Form */}
            <div className="bg-gray-800 shadow-xl rounded-3xl sm:rounded-4xl p-6 sm:p-8 border border-gray-700">

              <h2 className="text-2xl sm:text-3xl font-bold text-white">Send Us a Message</h2>
              <p className="text-gray-400 mt-2 text-sm sm:text-base">
                Fill out the form below and we&apos;ll get back to you shortly.
              </p>

              <ContactForm />
            </div>

            {/* Right Side */}
            <div className="space-y-6 sm:space-y-8">

              {/* Delivery Areas */}
              {deliveryAreas.length > 0 && (
                <div className="bg-gray-800 rounded-3xl sm:rounded-4xl p-6 sm:p-8 border border-gray-700">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">Delivery Areas</h3>
                  <p className="text-gray-400 mt-3 text-sm sm:text-base">
                    We currently deliver across the following areas:
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-3 mt-6">
                    {deliveryAreas.map((area) => (
                      <span key={area} className="bg-gray-700 text-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm sm:text-base shadow-sm">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Business Hours */}
              <div className="bg-gray-800 shadow-lg rounded-3xl sm:rounded-4xl p-6 sm:p-8 border border-gray-700">
                <h3 className="text-xl sm:text-2xl font-bold text-white">Operating Hours</h3>
                <div className="mt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between text-gray-300 gap-1 sm:gap-0 text-sm sm:text-base">
                    <span>Monday - Friday</span>
                    <span className="text-gray-400 sm:text-gray-300">{hoursWeekday}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-gray-300 gap-1 sm:gap-0 text-sm sm:text-base">
                    <span>Saturday</span>
                    <span className="text-gray-400 sm:text-gray-300">{hoursSaturday}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-gray-300 gap-1 sm:gap-0 text-sm sm:text-base">
                    <span>Sunday</span>
                    <span className="text-gray-400 sm:text-gray-300">{hoursSunday}</span>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="rounded-3xl sm:rounded-4xl overflow-hidden shadow-lg border border-gray-700">
                {mapEmbedUrl ? (
                  <iframe
                    src={mapEmbedUrl}
                    className="w-full h-60 sm:h-75"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="h-60 sm:h-75 bg-linear-to-br from-gray-800 to-gray-700 flex items-center justify-center">
                    <div className="text-center px-4">
                      <FaMapMarkerAlt className="text-4xl sm:text-5xl text-orange-400 mx-auto" />
                      <h3 className="mt-4 text-xl sm:text-2xl font-bold text-white">{displayLocation}</h3>
                      <p className="text-gray-400 mt-2 text-sm sm:text-base">Google Maps Embed Here</p>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="pb-16 sm:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-linear-to-r from-red-500 to-red-900 rounded-[30px] sm:rounded-[40px] text-white text-center p-8 sm:p-12">
            <h2 className="text-2xl sm:text-4xl font-bold">{ctaTitle}</h2>
            <p className="mt-4 text-orange-100 text-sm sm:text-lg">{ctaDescription}</p>
            <a href="/menu" className="mt-8 inline-block bg-white text-red-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:scale-105 transition text-sm sm:text-base">
              {ctaButtonText}
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
