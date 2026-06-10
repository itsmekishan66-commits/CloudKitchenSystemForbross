import Image from "next/image";

export default function PopularKitchens() {
  const kitchens = [
    {
      name: "Urban Slice",
      category: "ARTISAN PIZZA",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
    },
    {
      name: "Green Root",
      category: "HEALTHY BOWLS",
      image:
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
    },
    {
      name: "Taco Theory",
      category: "MEXICAN STREET FOOD",
      image:
        "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=800",
    },
    {
      name: "Silk Road",
      category: "PAN-ASIAN FUSION",
      image:
        "https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=800",
    },
  ];

  return (
    <section className="bg-[#f5f5f5] py-16">

      <div className="max-w-7xl mx-auto px-6">

        {/* Popular Kitchens */}
        <div>
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-4xl font-bold text-gray-900">
                Our Popular Kitchens
              </h2>

              <p className="text-red-800 mt-2">
                Crafted by culinary masters for your convenience.
              </p>
            </div>

            <button className="text-red-900 font-semibold hover:underline">
              View All Kitchens
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

            {kitchens.map((kitchen) => (
              <div
                key={kitchen.name}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-52">
                  <Image
                    src={kitchen.image}
                    alt={kitchen.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="p-5">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {kitchen.name}
                  </h3>

                  <p className="text-red-700 text-xs font-semibold tracking-widest mt-1">
                    {kitchen.category}
                  </p>
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* App Download Banner */}
        <div className="mt-16">

          <div className="relative overflow-hidden rounded-[30px] bg-linear-to-r from-[#8b0000] to-[#9f0000] shadow-xl">

            <div className="grid lg:grid-cols-2 items-center">

              {/* Left */}
              <div className="p-10 md:p-16">

                <h2 className="text-4xl md:text-5xl font-bold text-white">
                  Get the Mama&apos;s Kitchen App
                </h2>

                <p className="mt-5 text-gray-200 text-lg max-w-xl">
                  Order faster, track your delivery in real-time,
                  and get exclusive app-only chef specials and rewards.
                </p>

                <div className="flex flex-wrap gap-4 mt-8">

                  <button className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition">
                    Google Play
                  </button>

                  <button className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition">
                    App Store
                  </button>

                </div>

              </div>

              {/* Right Phone Mockup */}
              <div className="hidden lg:flex justify-center items-center py-10">

                <div className="w-42.5 h-80 bg-white rounded-[35px] border-4 border-gray-200 shadow-2xl relative">

                  <div className="absolute top-5 left-5 text-red-300 text-4xl">
                    🍴
                  </div>

                </div>

              </div>

            </div>

            {/* Decorative Blur */}
            <div className="absolute -left-20 bottom-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

          </div>

        </div>

      </div>

    </section>
  );
}