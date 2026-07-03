"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-[url('/smoky-atmosphere-background.jpg')] bg-no-repeat bg-cover bg-bottom overflow-hidden text-white">

      {/* <div className="absolute inset-0 bg-linear-to-r from-white to-transparent" /> */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 min-h-screen flex items-center">
        <div className="max-w-xl">
          <motion.h1
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold leading-tight"
          >
            Fresh Meals Delivered Straight From Our Cloud Kitchen
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-white/70 text-xl font-medium"
          >
            Experience gourmet dining at home with freshly prepared meals and
            lightning-fast delivery.
          </motion.p>

          {/* Buttons */}
          <div className="flex gap-4 mt-10">
            <Link href="/menu"
              className="bg-red-900 text-white px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-all"
            > Order Now </Link>

            <Link href="/menu"
              className="border border-red-900 text-red-900 px-10 py-4 rounded-full hover:bg-red-900 hover:text-white transition-all"
            > Explore Menu </Link>
          </div>
        </div>

        <div className="relative w-1/2 h-screen">
          {/* Main Orange Circle */}
          <div className="absolute right-25 top-45 h-113 w-113 rounded-full bg-orange-600" />
          {/* Orbit circles */}
          <div className="absolute right-15 top-35 h-130 w-130 rounded-full border border-orange-500/80" />
          <div className="absolute right-7.5 top-28 h-145 w-145 rounded-full border border-orange-500/50" />
          <div className="absolute right-0 top-20 h-158 w-158 rounded-full border border-orange-500/30" />
          {/* Orbit Dot */}
          <div className="absolute right-30 top-75 h-5 w-5 rounded-full bg-orange-500" />
          
          <Image
            src="/firstbowl.webp"
            alt="Food bowl"
            width={320}
            height={320}
            className="absolute top-25 right-60 h-80 w-80 rounded-full object-cover shadow-[0_20px_60px_rgba(0,0,0,.8)]"
          />

          <Image
            src="/secondbowl.webp"
            alt="Food bowl"
            width={260}
            height={260}
            className="absolute bottom-25 right-20 h-64 w-64 rounded-full object-cover shadow-[0_20px_60px_rgba(0,0,0,.8)]"
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-90 bottom-25"
          >
            <Image
              src="/floating leaf.png"
              alt="Leaf"
              width={300}
              height={200}
              className="rotate-[-20deg]"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: [0, -10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute left-95 bottom-95"
          >
            <Image
              src="/floating leaf.png"
              alt="Tomato"
              width={200}
              height={200}
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
}