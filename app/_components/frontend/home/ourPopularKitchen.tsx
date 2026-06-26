"use client";

import Image from "next/image";
import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function PopularKitchens() {
  const [siteName, setSiteName] = useState("Cloud Kitchen");

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error && data.siteName) setSiteName(data.siteName);
      })
      .catch(() => { });
  }, []);

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

  const [currentIndex, setCurrentIndex] = useState(0);
  const touchX = useRef(0);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % kitchens.length);
  }, [kitchens.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + kitchens.length) % kitchens.length);
  }, [kitchens.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  const current = kitchens[currentIndex];

  // this is the function that will be called when the user clicks the button
  return (

    <section className="bg-[#f5f5f5] py-8 md:py-16">

      <div className="max-w-7xl mx-auto px-6">

        {/* Popular Kitchens */}
        <div>
          <div className="text-center mb-10">
            <p className="text-red-800 mt-2">
              Crafted by culinary masters for your convenience.
            </p>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mt-4">
              Our Popular Kitchens
            </h2>

          </div>

          {/* Mobile carousel */}
          <div className="md:hidden relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {current && (
              <div
                key={current.name}
                className="bg-white rounded-2xl overflow-hidden shadow-md"
              >
                <div className="relative h-52">
                  <Image
                    src={current.image}
                    alt={current.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {current.name}
                  </h3>
                  <p className="text-red-700 text-xs font-semibold tracking-widest mt-1">
                    {current.category}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition"
            >
              <ChevronRight size={20} />
            </button>

            <div className="flex justify-center gap-2 mt-6">
              {kitchens.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition ${i === currentIndex ? "bg-red-900" : "bg-gray-300"
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Desktop grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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

          <div className="text-center mt-6 md:mt-14">
            <Link href="/menu" className="inline-block border border-red-900 text-red-900 px-10 py-4 rounded-full hover:bg-red-900 hover:text-white transition">
              View All Kitchens
            </Link>
          </div>
        </div>

        {/* App Download Banner */}
        <div className="mt-16">

          <div className="relative overflow-hidden rounded-[30px] bg-linear-to-r from-[#8b0000] to-[#9f0000] shadow-xl">

            <div className="grid lg:grid-cols-2 items-center">

              {/* Left */}
              <div className="p-10 md:p-16">

                <h2 className="text-4xl md:text-5xl font-bold text-white">
                  Get the {siteName} App
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