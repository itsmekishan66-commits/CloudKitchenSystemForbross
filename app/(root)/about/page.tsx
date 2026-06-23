import {
  FaClock,
  FaMotorcycle,
  FaUtensils,
  FaStar,
  FaLeaf,
  FaUsers,
} from "react-icons/fa";
import { getSiteSettings } from "@/lib/get-site-settings";

const iconMap: Record<string, React.ReactNode> = {
  "Premium Ingredients": <FaUtensils />,
  "Fast Delivery": <FaMotorcycle />,
  "Always On Time": <FaClock />,
  "Healthy Choices": <FaLeaf />,
};

export default async function AboutPage() {
  const { siteName, aboutContent } = await getSiteSettings();

  const a = aboutContent as Record<string, unknown>;
  const heroBadge = (a.heroBadge as string) || "Nepal's Favorite Cloud Kitchen";
  const heroHeading = (a.heroHeading as string) || "Fresh Food.";
  const heroHeadingAccent = (a.heroHeadingAccent as string) || "Delivered Fast.";
  const heroDescription = (a.heroDescription as string) || "";
  const stats = (a.stats as Array<{ value: string; label: string }>) || [];
  const storySectionTitle = (a.storySectionTitle as string) || "Our Story";
  const storyTitle = (a.storyTitle as string) || "";
  const storyParagraphs = (a.storyParagraphs as string[]) || [];
  const storyImage = (a.storyImage as string) || "";
  const featuresTitle = (a.featuresTitle as string) || "Why Customers Love Us";
  const featuresSubtitle = (a.featuresSubtitle as string) || "";
  const features = (a.features as Array<{ title: string; desc: string }>) || [];
  const processTitle = (a.processTitle as string) || "How It Works";
  const process = (a.process as Array<{ number: string; title: string; desc: string }>) || [];
  const testimonialsTitle = (a.testimonialsTitle as string) || "Customer Reviews";
  const testimonials = (a.testimonials as Array<{ text: string; name: string; title: string }>) || [];
  const ctaTitle = (a.ctaTitle as string) || "Ready to Taste Something Amazing?";
  const ctaDescription = (a.ctaDescription as string) || "";
  const ctaButtonText = (a.ctaButtonText as string) || "Order Now";

  return (
    <main className="bg-white">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-orange-50 via-white to-red-50">
        <div className="max-w-7xl mx-auto px-6 py-24">

          <div className="grid lg:grid-cols-2 gap-16 items-center">

            <div>
              <span className="bg-orange-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium">
                {heroBadge}
              </span>

              <h1 className="mt-6 text-5xl lg:text-7xl font-bold leading-tight">
                {heroHeading}
                <span className="block text-red-500">
                  {heroHeadingAccent}
                </span>
              </h1>

              {heroDescription && (
                <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                  {heroDescription}
                </p>
              )}

              <div className="flex flex-wrap gap-4 mt-8">
                <a href="/menu" className="bg-red-900 hover:bg-red-800 text-white px-8 py-4 rounded-xl font-semibold transition">
                  Explore Menu
                </a>
                <a href="/contact" className="border border-gray-300 hover:border-orange-500 px-8 py-4 rounded-xl font-semibold transition">
                  Contact Us
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-orange-200 opacity-40 rounded-full"></div>

              <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200"
                alt="Food"
                className="relative rounded-3xl shadow-2xl w-full h-125 object-cover"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Stats */}
      {stats.length > 0 && (
        <section className="py-16 border-y">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <h3 className="text-4xl font-bold text-red-600">{stat.value}</h3>
                  <p className="text-gray-600 mt-2">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Story */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              {storyImage && (
                <img
                  src={storyImage}
                  alt="Kitchen"
                  className="rounded-3xl shadow-xl"
                />
              )}
            </div>
            <div>
              <span className="text-redwhile-500 font-semibold uppercase tracking-wider">
                {storySectionTitle}
              </span>
              <h2 className="mt-4 text-4xl font-bold">{storyTitle}</h2>
              {storyParagraphs.map((p, i) => (
                <p key={i} className="mt-4 text-gray-600 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      {features.length > 0 && (
        <section className="bg-gray-50 py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold">{featuresTitle}</h2>
              {featuresSubtitle && <p className="text-gray-600 mt-4">{featuresSubtitle}</p>}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((item) => (
                <div key={item.title} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition">
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 text-red-500 flex items-center justify-center text-2xl">
                    {iconMap[item.title] || <FaStar />}
                  </div>
                  <h3 className="mt-6 text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Process */}
      {process.length > 0 && (
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold">{processTitle}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {process.map((step) => (
                <div key={step.number} className="text-center p-8 border rounded-3xl">
                  <div className="text-6xl font-bold text-orange-100">{step.number}</div>
                  <h3 className="text-2xl font-bold mt-4">{step.title}</h3>
                  <p className="text-gray-600 mt-3">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="bg-orange-50 py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold">{testimonialsTitle}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((item, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl shadow-sm">
                  <div className="flex gap-1 text-yellow-500">
                    {[...Array(5)].map((_, j) => <FaStar key={j} />)}
                  </div>
                  <p className="mt-4 text-gray-600">{item.text}</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-orange-200"></div>
                    <div>
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-gray-500">{item.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-linear-to-r from-red-500 to-red-900 text-white rounded-[40px] p-12 text-center">
            <FaUsers className="mx-auto text-5xl mb-6" />
            <h2 className="text-4xl font-bold">{ctaTitle}</h2>
            {ctaDescription && (
              <p className="mt-4 text-lg text-orange-100">{ctaDescription}</p>
            )}
            <a href="/menu" className="mt-8 inline-block bg-white text-red-600 px-8 py-4 rounded-xl font-bold hover:scale-105 transition">
              {ctaButtonText}
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
