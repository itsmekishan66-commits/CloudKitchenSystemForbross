import {
  FaClock,
  FaMotorcycle,
  FaUtensils,
  FaStar,
  FaLeaf,
  FaUsers,
} from "react-icons/fa";
import Image from "next/image";
import { getSiteSettings } from "@/lib/get-site-settings";

const iconMap: Record<string, React.ReactNode> = {
  "Premium Ingredients": <FaUtensils />,
  "Fast Delivery": <FaMotorcycle />,
  "Always On Time": <FaClock />,
  "Healthy Choices": <FaLeaf />,
};

export default async function AboutPage() {
  const { aboutContent } = await getSiteSettings();

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
    <main className="bg-black text-white">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-gray-900 via-black to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">

          <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">

            <div>
              <span className="bg-gray-800 text-orange-400 px-4 py-2 rounded-full text-sm font-medium inline-block">
                {heroBadge}
              </span>

              <h1 className="mt-6 text-3xl sm:text-5xl lg:text-7xl font-bold leading-tight text-white">
                {heroHeading}
                <span className="block text-red-500">
                  {heroHeadingAccent}
                </span>
              </h1>

              {heroDescription && (
                <p className="mt-6 text-base sm:text-lg text-gray-400 leading-relaxed">
                  {heroDescription}
                </p>
              )}

              <div className="flex sm:flex-row gap-4 mt-8">
                <a href="/menu" className="bg-red-900 hover:bg-red-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition text-center">
                  Explore Menu
                </a>
                <a href="/contact" className="border border-gray-600 hover:border-orange-500 text-gray-300 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition text-center">
                  Contact Us
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-orange-900 opacity-30 rounded-full"></div>

              <Image
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200"
                alt="Food"
                width={1200}
                height={700}
                className="relative rounded-3xl shadow-2xl w-full h-64 sm:h-100 lg:h-125 object-cover"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Stats */}
      {stats.length > 0 && (
        <section className="py-12 sm:py-16 border-y border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <h3 className="text-3xl sm:text-4xl font-bold text-red-500">{stat.value}</h3>
                  <p className="text-gray-400 mt-2 text-sm sm:text-base">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Story */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
            <div className="order-2 lg:order-1">
              {storyImage && (
                <Image
                  src={storyImage}
                  alt="Kitchen"
                  width={800}
                  height={600}
                  className="rounded-3xl shadow-xl w-full"
                />
              )}
            </div>
            <div className="order-1 lg:order-2">
              <span className="text-orange-400 font-semibold uppercase tracking-wider text-sm sm:text-base">
                {storySectionTitle}
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white">{storyTitle}</h2>
              {storyParagraphs.map((p, i) => (
                <p key={i} className="mt-4 text-gray-400 leading-relaxed text-sm sm:text-base">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      {features.length > 0 && (
        <section className="bg-gray-900 py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">{featuresTitle}</h2>
              {featuresSubtitle && <p className="text-gray-400 mt-4 text-sm sm:text-base">{featuresSubtitle}</p>}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {features.map((item) => (
                <div key={item.title} className="bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-black/50 transition border border-gray-700">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gray-700 text-orange-400 flex items-center justify-center text-xl sm:text-2xl">
                    {iconMap[item.title] || <FaStar />}
                  </div>
                  <h3 className="mt-5 sm:mt-6 text-sm md  :text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-3 text-gray-400 text-sm sm:text-base">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Process */}
      {process.length > 0 && (
        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">{processTitle}</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {process.map((step, idx) => (
                <div key={step.number} className={`text-center p-6 sm:p-8 border border-gray-700 rounded-3xl ${process.length % 2 === 1 && idx === process.length - 1 ? 'col-span-2 lg:col-span-1' : ''}`}>
                  <div className="text-4xl sm:text-6xl font-bold text-gray-700">{step.number}</div>
                  <h3 className="text-sm sm:text-2xl font-bold mt-4 text-white">{step.title}</h3>
                  <p className="text-gray-400 mt-3 text-sm sm:text-base">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="bg-gray-900 py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">{testimonialsTitle}</h2>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {testimonials.map((item, i) => (
                <div key={i} className="bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-700">
                  <div className="flex gap-1 text-yellow-500 text-sm sm:text-base">
                    {[...Array(5)].map((_, j) => <FaStar key={j} />)}
                  </div>
                  <p className="mt-4 text-gray-400 text-sm sm:text-base">{item.text}</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-700 shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-white text-sm sm:text-base">{item.name}</h4>
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
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-linear-to-r from-red-500 to-red-900 text-white rounded-[30px] sm:rounded-[40px] p-8 sm:p-12 text-center">
            <FaUsers className="mx-auto text-4xl sm:text-5xl mb-6" />
            <h2 className="text-2xl sm:text-4xl font-bold">{ctaTitle}</h2>
            {ctaDescription && (
              <p className="mt-4 text-base sm:text-lg text-orange-100">{ctaDescription}</p>
            )}
            <a href="/menu" className="mt-8 inline-block bg-white text-red-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:scale-105 transition text-sm sm:text-base">
              {ctaButtonText}
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
