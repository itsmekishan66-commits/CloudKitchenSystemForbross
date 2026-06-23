"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type ApiCategory = {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  isActive: boolean;
};

export default function CravingsSection() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);

  useEffect(() => {
    fetch("/api/categories?active=true")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => { });
  }, []);

  return (
    <section className="bg-white py-20 overflow-x">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center">
          <h2 className="text-4xl font-bold">Cravings</h2>

          <button
            className="
            border
            border-red-900
            text-red-900
            hover:bg-red-900
           hover:text-white
            cursor-pointer
            px-8
            py-3
            rounded-full
          "
          >
            <Link href="/menu">
              View All
            </Link>
          </button>
        </div>

        <div
          className="
          mt-12
          flex
          gap-10
          overflow-x-auto
          flex-nowrap
          pb-4
          no-scrollbar
        "
        >
          {categories.length > 0 ? categories.map((category) => (
            <div key={category.id} className="text-center cursor-pointer">
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
                  src={category.image || "/categories/default.jpg"}
                  alt={category.name}
                  width={100}
                  height={100}
                  className=" w-30 h-30 rounded-full object-cover"
                />
              </div>

              <p className="mt-3 font-medium">{category.name}</p>
            </div>
          )) : (
            <p className="text-gray-400">No categories available yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
