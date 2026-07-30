"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-[url('/smoky-atmosphere-background.jpg')] bg-no-repeat bg-cover bg-bottom overflow-hidden text-white">
      <div className="relative z-10 max-w-7xl mx-auto px-6 min-h-screen flex flex-col-reverse lg:flex-row items-center justify-center gap-12 lg:gap-8 py-24 lg:py-0">

        {/* Text block */}
        <div className="w-full lg:max-w-xl text-center lg:text-left">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-2xl md:text-5xl font-bold leading-tight text-balance"
          >
            Fresh Meals Delivered Straight From Our Cloud Kitchen
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 md:mt-8 text-white/70 text-[12px] sm:text-lg md:text-xl font-medium text-balance"
          >
            Experience gourmet dining at home with freshly prepared meals and lightning-fast delivery.
          </motion.p>

          <div className="flex sm:flex-row justify-center lg:justify-start gap-4 mt-8 md:mt-10">
            <Link
              href="/menu"
              className="bg-red-900 text-white px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-all text-center"
            >
              Order Now
            </Link>

            <Link
              href="/menu"
              className="border border-red-900 text-white px-10 py-4 rounded-full hover:bg-red-900 hover:text-white transition-all text-center"
            >
              Explore Menu
            </Link>
          </div>
        </div>

        {/* Visual composition — fluid square that scales with viewport */}
        <div className="relative w-full max-w-85 md:max-w-110 lg:max-w-140 aspect-square shrink-0">
          {/* Main Orange Circle */}
          <div className="absolute right-[8%] md:right-[6%] top-[10%] h-[62%] w-[62%] rounded-full bg-orange-600" />

          {/* Orbit rings — only show on larger screens so it doesn't get busy on mobile */}
          <div className="block absolute right-[2%] md:right-[2%] top-[4%] h-[72%] w-[72%] rounded-full border border-orange-500/80" />
          <div className="block absolute right-[3.5%]  md:right-[-3%] top-[-1%] h-[80%] w-[80%] rounded-full border border-orange-500/50" />
          <div className="block absolute right-[4%] md:right-[-6%] top-[-6%] h-[88%] w-[88%] rounded-full border border-orange-500/30" />

          {/* Orbit dot */}
          <div className="hidden sm:block absolute right-[16%] top-[42%] h-3 w-3 md:h-5 md:w-5 rounded-full bg-orange-500" />

          <Image
            src="/firstbowl.webp"
            alt="Food bowl"
            width={320}
            height={320}
            className="absolute top-[12%] right-[32%] h-[44%] w-[44%] rounded-full object-cover shadow-[0_20px_60px_rgba(0,0,0,.8)]"
          />

          <Image
            src="/secondbowl.webp"
            alt="Food bowl"
            width={260}
            height={260}
            className="absolute bottom-[10%] right-[6%] h-[36%] w-[36%] rounded-full object-cover shadow-[0_20px_60px_rgba(0,0,0,.8)]"
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-[45%] bottom-[12%] w-[30%]"
          >
            <Image
              src="/floating leaf.png"
              alt="Leaf"
              width={400}
              height={400}
              className="w-full h-full rotate-[-20deg]"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: [0, -10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute right-[2%] top-[24%] w-[28%]"
          >
            <Image
              src="/floating leaf.png"
              alt="Leaf"
              width={400}
              height={400}
              className="w-full h-auto rotate-[-20deg]"
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
}