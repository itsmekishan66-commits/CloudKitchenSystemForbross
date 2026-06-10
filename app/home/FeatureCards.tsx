"use client";

import { ChefHat, Truck, ShieldCheck, MapPinned } from "lucide-react";

const features = [
  {
    icon: ChefHat,
    title: "Professional Chefs",
    desc: "Expert chefs crafting delicious meals.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    desc: "Lightning-fast delivery to your doorstep.",
  },
  {
    icon: ShieldCheck,
    title: "Quality Assured",
    desc: "Fresh ingredients and strict standards.",
  },
  {
    icon: MapPinned,
    title: "Wide Coverage",
    desc: "Reliable service across the city.",
  },
];

export default function FeatureCards() {
  return (
    <section className="bg-[#f5f1e9] pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={index}
                className="
                bg-white
                rounded-3xl
                p-8
                text-center
                shadow-lg
                hover:-translate-y-2
                transition-all
                duration-300
              "
              >
                <div
                  className="
                  w-14
                  h-14
                  mx-auto
                  rounded-full
                  bg-yellow-400
                  flex
                  items-center
                  justify-center
                "
                >
                  <Icon size={24} />
                </div>

                <h3 className="font-bold text-xl mt-5">{feature.title}</h3>

                <p className="text-gray-600 mt-3">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
