"use client";

import Image from "next/image";

const categories = [
  {
    name: "Pizza",
    image: "/categories/pizza.webp",
  },
  {
    name: "Burgers",
    image: "/categories/burger.webp",
  },
  {
    name: "Momos",
    image: "/categories/momo.avif",
  },
  {
    name: "Biryani",
    image: "/categories/biryani.jpg",
  },
  {
    name: "Drinks",
    image: "/categories/drinks.webp",
  },
  {
    name: "Desserts",
    image: "/categories/desserts.jpg",
  },
];

export default function CravingsSection() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center">
          <h2 className="text-4xl font-bold">Cravings</h2>

          <button
            className="
            border
            border-red-900
            text-red-900
            px-8
            py-3
            rounded-full
          "
          >
            View All
          </button>
        </div>

        <div
          className="
          mt-12
          flex
          justify-center
          gap-10
          flex-wrap
        "
        >
          {categories.map((category) => (
            <div key={category.name} className="text-center cursor-pointer">
              <div
                className="
                h-40
                w-40
                rounded-full
                bg-gray-100
                flex
                items-center
                justify-center
                mx-auto
                hover:scale-110
                transition
                
              "
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  width={100}
                  height={100}
                  className=" w-30 h-30 rounded-full object-cover"
                />
              </div>

              <p className="mt-3 font-medium">{category.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
