import {
  FaClock,
  FaMotorcycle,
  FaUtensils,
  FaStar,
  FaLeaf,
  FaUsers,
} from "react-icons/fa";

export default function AboutPage() {
  return (
    <main className="bg-white">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-orange-50 via-white to-red-50">
        <div className="max-w-7xl mx-auto px-6 py-24">

          <div className="grid lg:grid-cols-2 gap-16 items-center">

            <div>
              <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium">
                Nepal&apos;s Favorite Cloud Kitchen
              </span>

              <h1 className="mt-6 text-5xl lg:text-7xl font-bold leading-tight">
                Fresh Food.
                <span className="block text-orange-500">
                  Delivered Fast.
                </span>
              </h1>

              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                We are a modern cloud kitchen dedicated to crafting
                restaurant-quality meals and delivering them straight to your
                doorstep. No dine-in, no compromise—just amazing food.
              </p>

              <div className="flex flex-wrap gap-4 mt-8">
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold transition">
                  Explore Menu
                </button>

                <button className="border border-gray-300 hover:border-orange-500 px-8 py-4 rounded-xl font-semibold transition">
                  Contact Us
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-orange-200 opacity-40 rounded-full"></div>

              <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200"
                alt="Food"
                className="relative rounded-3xl shadow-2xl w-full h-[500px] object-cover"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y">
        <div className="max-w-7xl mx-auto px-6">

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">

            {[
              ["10K+", "Orders Delivered"],
              ["500+", "Daily Customers"],
              ["4.9★", "Customer Rating"],
              ["30 min", "Average Delivery"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="text-center"
              >
                <h3 className="text-4xl font-bold text-orange-500">
                  {value}
                </h3>

                <p className="text-gray-600 mt-2">
                  {label}
                </p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">

          <div className="grid lg:grid-cols-2 gap-16 items-center">

            <div>
              <img
                src="https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200"
                alt="Kitchen"
                className="rounded-3xl shadow-xl"
              />
            </div>

            <div>
              <span className="text-orange-500 font-semibold uppercase tracking-wider">
                Our Story
              </span>

              <h2 className="mt-4 text-4xl font-bold">
                Built for the Digital Food Era
              </h2>

              <p className="mt-6 text-gray-600 leading-relaxed">
                We started with one simple mission: provide exceptional meals
                without the limitations of traditional restaurants.
              </p>

              <p className="mt-4 text-gray-600 leading-relaxed">
                Our chefs focus entirely on food quality while our delivery
                network ensures every meal arrives fresh, hot, and on time.
              </p>

              <p className="mt-4 text-gray-600 leading-relaxed">
                From burgers and pizzas to healthy bowls and desserts, every
                dish is crafted with premium ingredients and passion.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold">
              Why Customers Love Us
            </h2>

            <p className="text-gray-600 mt-4">
              More than just food delivery.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

            {[
              {
                icon: <FaUtensils />,
                title: "Premium Ingredients",
                desc: "Fresh ingredients sourced daily.",
              },
              {
                icon: <FaMotorcycle />,
                title: "Fast Delivery",
                desc: "Delivered quickly and safely.",
              },
              {
                icon: <FaClock />,
                title: "Always On Time",
                desc: "Efficient kitchen workflow.",
              },
              {
                icon: <FaLeaf />,
                title: "Healthy Choices",
                desc: "Nutritious options for everyone.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center text-2xl">
                  {item.icon}
                </div>

                <h3 className="mt-6 text-xl font-bold">
                  {item.title}
                </h3>

                <p className="mt-3 text-gray-600">
                  {item.desc}
                </p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">

            {[
              {
                number: "01",
                title: "Choose Your Meal",
                desc: "Browse our curated menu.",
              },
              {
                number: "02",
                title: "We Prepare It",
                desc: "Freshly cooked by expert chefs.",
              },
              {
                number: "03",
                title: "Delivered To You",
                desc: "Fast delivery to your doorstep.",
              },
            ].map((step) => (
              <div
                key={step.number}
                className="text-center p-8 border rounded-3xl"
              >
                <div className="text-6xl font-bold text-orange-100">
                  {step.number}
                </div>

                <h3 className="text-2xl font-bold mt-4">
                  {step.title}
                </h3>

                <p className="text-gray-600 mt-3">
                  {step.desc}
                </p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-orange-50 py-24">
        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold">
              Customer Reviews
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-white p-8 rounded-3xl shadow-sm"
              >
                <div className="flex gap-1 text-yellow-500">
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                </div>

                <p className="mt-4 text-gray-600">
                  Amazing food quality, quick delivery, and excellent
                  packaging. Highly recommended!
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-200"></div>

                  <div>
                    <h4 className="font-semibold">
                      Happy Customer
                    </h4>
                    <p className="text-sm text-gray-500">
                      Food Lover
                    </p>
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">

          <div className="bg-linear-to-r from-orange-500 to-red-500 text-white rounded-[40px] p-12 text-center">

            <FaUsers className="mx-auto text-5xl mb-6" />

            <h2 className="text-4xl font-bold">
              Ready to Taste Something Amazing?
            </h2>

            <p className="mt-4 text-lg text-orange-100">
              Join thousands of happy customers ordering delicious meals every
              day.
            </p>

            <button className="mt-8 bg-white text-orange-600 px-8 py-4 rounded-xl font-bold hover:scale-105 transition">
              Order Now
            </button>

          </div>
        </div>
      </section>

    </main>
  );
}