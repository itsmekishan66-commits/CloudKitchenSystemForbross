"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-[url(/images/hero-bg.png)] bg-no-repeat bg-cover bg-center bg-amber-600">
      <div className="absolute inset-0 bg-white/70" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 min-h-screen flex items-center">
        <div className="max-w-xl">
          <motion.h1
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-6xl font-bold leading-tight"
          >
            Fresh Meals Delivered Straight From Our Cloud Kitchen
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-gray-700 text-lg"
          >
            Experience gourmet dining at home with freshly prepared meals and
            lightning-fast delivery.
          </motion.p>

          <div className="flex gap-4 mt-8">
            <button className="bg-red-900 text-white px-8 py-4 rounded-full shadow-lg">
              Order Now
            </button>

            <button className="border border-red-900 text-red-900 px-8 py-4 rounded-full">
              Explore Menu
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
