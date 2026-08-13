import Link from "next/link";
import { getSiteSettings } from "@/lib/get-site-settings";

export default async function SeoContentSection() {
  const { siteName, location, contactContent } = await getSiteSettings();
  const c = (contactContent as Record<string, unknown>) || {};
  const deliveryAreas =
    (c.deliveryAreas as string[])?.slice(0, 6) || [];

  return (
    <section className="bg-black text-white py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10 md:mb-14">
          <span className="inline-block text-red-500 uppercase tracking-[0.2em] text-sm font-semibold">
            Online Food Ordering
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
            Order Food Online From {siteName}
          </h2>
          <p className="mt-4 text-gray-400 text-base md:text-lg max-w-3xl mx-auto">
            Craving something delicious? {siteName} is a cloud kitchen built for
            fast, reliable online food ordering. Browse our menu, place your
            order in seconds, and get fresh, hot meals delivered straight to
            your doorstep.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          <div className="bg-gray-900 rounded-3xl p-6 md:p-8 border border-gray-800">
            <h3 className="text-xl font-bold">Cloud Kitchen Delivery</h3>
            <p className="mt-3 text-gray-400 text-sm leading-relaxed">
              We prepare every dish fresh to order in our professional cloud
              kitchen &mdash; no dine-in, no compromise. Quality food, prepared by
              expert chefs and delivered fast across{" "}
              {location ? `${location} and nearby areas` : "your city"}.
            </p>
          </div>

          <div className="bg-gray-900 rounded-3xl p-6 md:p-8 border border-gray-800">
            <h3 className="text-xl font-bold">Order Online, Anytime</h3>
            <p className="mt-3 text-gray-400 text-sm leading-relaxed">
              From burgers and pizzas to healthy bowls and desserts, our online
              food ordering platform makes it easy to get your favorite meals.
              Order from your phone or computer and track your food from the
              kitchen to your door.
            </p>
          </div>

          <div className="bg-gray-900 rounded-3xl p-6 md:p-8 border border-gray-800">
            <h3 className="text-xl font-bold">Fast &amp; Fresh</h3>
            <p className="mt-3 text-gray-400 text-sm leading-relaxed">
              Hot, fresh, and on time &mdash; that&apos;s our promise. With efficient
              delivery and quality ingredients, you&apos;ll never settle for cold or
              late food again. Ordering food has never been this simple.
            </p>
          </div>
        </div>

        {deliveryAreas.length > 0 && (
          <div className="mt-10 text-center">
            <h3 className="text-lg font-semibold text-white">
              We deliver to {deliveryAreas.join(", ")} &amp; more
            </h3>
            <Link
              href="/menu"
              className="mt-6 inline-block bg-red-900 text-white px-8 py-4 rounded-full font-semibold hover:bg-red-800 transition"
            >
              Order Food Now
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
