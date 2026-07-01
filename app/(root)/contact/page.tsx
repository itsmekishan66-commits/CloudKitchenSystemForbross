import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
} from "react-icons/fa";
import { getSiteSettings } from "@/lib/get-site-settings";
import ContactForm from "./ContactForm";

export default async function ContactPage() {
  const { siteName, contactEmail, contactPhone, location, contactContent } =
    await getSiteSettings();

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
  const ctaTitle = (c.ctaTitle as string) || "Hungry Right Now?";
  const ctaDescription =
    (c.ctaDescription as string) ||
    "Browse our menu and get delicious meals delivered to your doorstep in minutes.";
  const ctaButtonText = (c.ctaButtonText as string) || "Order Now";

  const displayEmail = contactEmail || "hello@example.com";
  const displayPhone = contactPhone || "+977 9800000000";
  const displayLocation = location || "Biratnagar, Nepal";

  return (
    <main className="bg-white">

      {/* Hero */}
      <section className="bg-linear-to-br from-orange-50 via-white to-red-50">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">

          {/* <span className="bg-orange-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium">
            {heroBadge}
          </span> */}

          <h1 className="mt-6 text-5xl lg:text-6xl font-bold">
            {heroHeading}
            <span className="text-red-500 block">
              {heroHeadingAccent}
            </span>
          </h1>

          <p className="max-w-2xl mx-auto mt-6 text-gray-600 text-lg">
            {heroDescription}
          </p>

        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-white shadow-lg rounded-3xl p-8 text-center hover:-translate-y-1 transition">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-100 flex items-center justify-center text-red-500 text-xl">
                <FaPhoneAlt />
              </div>
              <h3 className="font-bold text-xl mt-5">Phone</h3>
              <p className="text-gray-500 mt-2">{displayPhone}</p>
            </div>

            <div className="bg-white shadow-lg rounded-3xl p-8 text-center hover:-translate-y-1 transition">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-100 flex items-center justify-center text-red-500 text-xl">
                <FaEnvelope />
              </div>
              <h3 className="font-bold text-xl mt-5">Email</h3>
              <p className="text-gray-500 mt-2">{displayEmail}</p>
            </div>

            <div className="bg-white shadow-lg rounded-3xl p-8 text-center hover:-translate-y-1 transition">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-100 flex items-center justify-center text-red-500 text-xl">
                <FaMapMarkerAlt />
              </div>
              <h3 className="font-bold text-xl mt-5">Location</h3>
              <p className="text-gray-500 mt-2">{displayLocation}</p>
            </div>

            <div className="bg-white shadow-lg rounded-3xl p-8 text-center hover:-translate-y-1 transition">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-100 flex items-center justify-center text-red-500 text-xl">
                <FaClock />
              </div>
              <h3 className="font-bold text-xl mt-5">Open Hours</h3>
              <p className="text-gray-500 mt-2">{hoursWeekday}</p>
            </div>

          </div>

        </div>
      </section>

      {/* Form + Info */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6">

          <div className="grid lg:grid-cols-2 gap-12">

            {/* Contact Form */}
            <div className="bg-white shadow-xl rounded-4xl p-8">

              <h2 className="text-3xl font-bold">Send Us a Message</h2>
              <p className="text-gray-500 mt-2">
                Fill out the form below and we&apos;ll get back to you shortly.
              </p>

              <ContactForm />
            </div>

            {/* Right Side */}
            <div className="space-y-8">

              {/* Delivery Areas */}
              {deliveryAreas.length > 0 && (
                <div className="bg-orange-50 rounded-4xl p-8">
                  <h3 className="text-2xl font-bold">Delivery Areas</h3>
                  <p className="text-gray-600 mt-3">
                    We currently deliver across the following areas:
                  </p>
                  <div className="flex flex-wrap gap-3 mt-6">
                    {deliveryAreas.map((area) => (
                      <span key={area} className="bg-white px-4 py-2 rounded-full shadow-sm">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Business Hours */}
              <div className="bg-white shadow-lg rounded-4xl p-8">
                <h3 className="text-2xl font-bold">Operating Hours</h3>
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span>{hoursWeekday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>{hoursSaturday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>{hoursSunday}</span>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="rounded-4xl overflow-hidden shadow-lg">
                <div className="h-75 bg-linear-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                  <div className="text-center">
                    <FaMapMarkerAlt className="text-5xl text-red-500 mx-auto" />
                    <h3 className="mt-4 text-2xl font-bold">{displayLocation}</h3>
                    <p className="text-gray-600 mt-2">Google Maps Embed Here</p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-linear-to-r from-red-500 to-red-900 rounded-[40px] text-white text-center p-12">
            <h2 className="text-4xl font-bold">{ctaTitle}</h2>
            <p className="mt-4 text-orange-100 text-lg">{ctaDescription}</p>
            <a href="/menu" className="mt-8 inline-block bg-white text-red-600 px-8 py-4 rounded-xl font-bold hover:scale-105 transition">
              {ctaButtonText}
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
