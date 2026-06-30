"use client";

import Image from "next/image";
import { Star, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useCart } from "../cart/CartContext";
import Link from "next/link";
import { safeImageUrl } from "@/lib/image";

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
    <div className=" bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
      <div className="relative h-64">
        <Image src={safeImageUrl(image)} alt={title} fill className="object-cover" />

        <span className=" absolute top-3 left-3 bg-white px-3 py-1 rounded-full text-xs font-medium"> {badge} </span>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-2xl">{title}</h3>

          <span className="font-bold text-red-900 text-xl"> Rs. {price}</span>
        </div>

        <p className="text-gray-600 mt-3 line-clamp-2">{description}</p>

        <div className="flex justify-between items-center mt-5">
          <div className="flex items-center gap-1">
            <Star size={16} className="fill-yellow-400 text-yellow-400" />

            <span>{rating}</span>

            <span className="text-gray-500">({reviews}) </span>
          </div>

          <button onClick={onAddToCart} className="w-10 h-10 rounded-full bg-red-900 text-white flex items-center justify-center hover:bg-red-800 transition">
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchX = useRef(0);

  useEffect(() => {
    fetch("/api/menu-items")
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => { });
  }, []);

  const featured = items.filter((i) => i.isAvailable).slice(0, 3);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % featured.length);
  }, [featured.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + featured.length) % featured.length);
  }, [featured.length]);

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

  const current = featured[currentIndex];

  return (
    <section className="bg-[#f5f1e9] py-8 md:py-16">
      <div className="max-w-7xl mx-auto px-4">

        <p className="text-center uppercase text-red-900 tracking-wider font-semibold">Chef&apos;s Selection</p>

        <h2 className="text-center text-3xl md:text-5xl font-bold mt-4 mb-8 md:mb-16">Featured Menu</h2>

        {/* Mobile carousel */}
        <div className="md:hidden relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {featured.length > 0 ? (
            <>
              {current && (
                <FoodCard
                  key={current.id}
                  title={current.title}
                  image={current.image || ""}
                  description={current.description || ""}
                  rating={Number(current.rating)}
                  reviews={current.reviews}
                  price={Number(current.price)}
                  badge={current.badge || ""}
                  onAddToCart={() => addToCart({ id: String(current.id), title: current.title, image: current.image || "", price: Number(current.price), quantity: 1 })}
                />
              )}

              <button onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition">
                <ChevronLeft size={20} />
              </button>
              <button onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition">
                <ChevronRight size={20} />
              </button>

              <div className="flex justify-center gap-2 mt-6">
                {featured.map((_, i) => (
                  <button key={i} onClick={() => setCurrentIndex(i)} className={`w-2.5 h-2.5 rounded-full transition ${i === currentIndex ? "bg-red-900" : "bg-gray-300"}`} />
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-gray-400 py-12">No featured items available yet.</p>
          )}
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-8">
          {featured.length > 0 ? featured.map((food) => (
            <FoodCard
              key={food.id}
              title={food.title}
              image={food.image || ""}
              description={food.description || ""}
              rating={Number(food.rating)}
              reviews={food.reviews}
              price={Number(food.price)}
              badge={food.badge || ""}
              onAddToCart={() => addToCart({ id: String(food.id), title: food.title, image: food.image || "", price: Number(food.price), quantity: 1 })}
            />
          )) : (
            <p className="col-span-full text-center text-gray-400 py-12"> No featured items available yet.</p>
          )}
        </div>

        <div className="text-center mt-6 md:mt-14">
          <Link href="/menu" className="inline-block border border-red-900 text-red-900 px-10 py-4 rounded-full hover:bg-red-900 hover:text-white transition">
            View Full Menu
          </Link>
        </div>

      </div>
    </section>
  );
}