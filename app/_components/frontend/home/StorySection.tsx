"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function StorySection() {
  return (
    <section className="bg-[#f5f1e9] py-5 overflow-hidden relative">
      <div className="absolute right-10 top-10 opacity-80">
      </div>

      <div className="max-w-7xl px-2">
        <div className="grid lg:grid-cols-2 gap-25 items-center">
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-orange-100 -z-10" /> */}

            {/* Top Image */}
            <Image src="/chef/Vector.png" alt="top decoration" width={400} height={400}
              className="absolute top-38 left-70"
            />

            {/* Main Chef Image */}
            <Image src="/chef/Group.png" alt="chef" width={700} height={700}
              className="relative z-10"
            />

            {/* side Image */}
            <Image src="/chef/Decore.png" alt="side decoration" width={100}height={100}
              className="absolute top-70 left-76 z-0 "
            />

          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <span className="bg-red-900 text-white px-5 py-2 rounded-3xl font-semibold">
              Our Story
            </span>

            <h2 className="text-5xl font-bold mt-6 mb-8">
              Crafted With Passion, Delivered With Care
            </h2>

            <p className="text-gray-700 leading-8 text-lg">
              Founded in 2026, FlavorHub Kitchen emerged from a simple idea:
              everyone deserves access to high-quality freshly prepared meals
              without premium restaurant prices.
              Our cloud kitchen model allows us to focus entirely on what
              matters most creating amazing food while ensuring affordability
              and consistent quality.
            </p>

            <p className="text-gray-700 leading-8 text-lg mt-6">
              Using modern kitchen technology and trusted local suppliers, we
              carefully prepare every meal from farm to fork.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
