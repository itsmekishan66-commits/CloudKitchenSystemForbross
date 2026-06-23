"use client";

import Image from "next/image";
import { Star, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "../cart/CartContext";
import Link from "next/link";

type ApiMenuItem = {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  description: string | null;
  price: string;
  badge: string | null;
  rating: string;
  reviews: number;
  isAvailable: boolean;
};

interface FoodCardProps {
  title: string;
  image: string;
  description: string;
  rating: number;
  reviews: number;
  price: number;
  badge: string;
}

function FoodCard({
  title,
  image,
  description,
  rating,
  reviews,
  price,
  badge,
  onAddToCart,
}: FoodCardProps & { onAddToCart: () => void }) {
  return (
    <div
      className="
      bg-white
      rounded-3xl
      overflow-hidden
      shadow-md
      hover:shadow-xl
      transition-all
      duration-300
      hover:-translate-y-2
    "
    >
      <div className="relative h-64">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />

        <span
          className="
          absolute
          top-3
          left-3
          bg-white
          px-3
          py-1
          rounded-full
          text-xs
          font-medium
        "
        >
          {badge}
        </span>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-2xl">
            {title}
          </h3>

          <span className="font-bold text-red-900 text-xl">
            Rs. {price}
          </span>
        </div>

        <p className="text-gray-600 mt-3 line-clamp-2">
          {description}
        </p>

        <div className="flex justify-between items-center mt-5">
          <div className="flex items-center gap-1">
            <Star
              size={16}
              className="fill-yellow-400 text-yellow-400"
            />

            <span>{rating}</span>

            <span className="text-gray-500">
              ({reviews})
            </span>
          </div>

          <button
            onClick={onAddToCart}
            className="
            w-10
            h-10
            rounded-full
            bg-red-900
            text-white
            flex
            items-center
            justify-center
            hover:bg-red-800
            transition
          "
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FeaturedMenu() {
  const { addToCart } = useCart();
  const [items, setItems] = useState<ApiMenuItem[]>([]);

  useEffect(() => {
    fetch("/api/menu-items")
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => {});
  }, []);

  const featured = items.filter((i) => i.isAvailable).slice(0, 3);

  return (
    <section className="bg-[#f5f1e9] py-16">
      <div className="max-w-7xl mx-auto px-4">

        <p
          className="
          text-center
          uppercase
          text-red-900
          tracking-wider
          font-semibold
        "
        >
          Chef&apos;s Selection
        </p>

        <h2
          className="
          text-center
          text-5xl
          font-bold
          mt-4
          mb-16
        "
        >
          Featured Menu
        </h2>

        <div
          className="
          grid
          md:grid-cols-2
          lg:grid-cols-3
          gap-8
        "
        >
          {featured.length > 0 ? featured.map((food) => (
            <FoodCard
              key={food.id}
              title={food.title}
              image={food.image || "/placeholder.jpg"}
              description={food.description || ""}
              rating={Number(food.rating)}
              reviews={food.reviews}
              price={Number(food.price)}
              badge={food.badge || ""}
              onAddToCart={() => addToCart({ id: String(food.id), title: food.title, image: food.image || "/placeholder.jpg", price: Number(food.price), quantity: 1 })}
            />
          )) : (
            <p className="col-span-full text-center text-gray-400 py-12">
              No featured items available yet.
            </p>
          )}
        </div>

        <div className="text-center mt-14">
          <Link
            href="/menu"
            className="
            inline-block
            border
            border-red-900
            text-red-900
            px-10
            py-4
            rounded-full
            hover:bg-red-900
            hover:text-white
            transition
          "
          >
            View Full Menu
          </Link>
        </div>

      </div>
    </section>
  );
}