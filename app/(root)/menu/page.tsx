"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useCart } from "../../_components/frontend/cart/CartContext";
import Image from "next/image";
import { FaPlusCircle, FaStar, FaStarHalfAlt } from "react-icons/fa";

type AddonItem = { name: string; price: number };

type ApiMenuItem = {
  id: number;
  categoryId: number | null;
  title: string;
  slug: string;
  image: string | null;
  description: string | null;
  price: string;
  badge: string | null;
  rating: string;
  reviews: number;
  isAvailable: boolean;
  addons: AddonItem[] | null;
  discountPercent: string | null;
};

type Food = {
  id: number;
  name: string;
  price: number;
  discountedPrice: number;
  discountPercent: number;
  image: string;
  description: string;
  category: string;
  rating: number;
  reviews: number;
  badge?: string;
  addons: AddonItem[];
};

const badgeColors: Record<string, string> = {
  popular: "bg-orange-500",
  "chef's special": "bg-purple-500",
  new: "bg-blue-500",
  healthy: "bg-teal-500",
  spicy: "bg-red-500",
  vegetarian: "bg-green-500",
  "low cal": "bg-teal-500",
  "best side": "bg-emerald-500",
};

function  getBadgeColor(badge?: string | null): string {
  if (!badge) return "bg-orange-500";
  return badgeColors[badge.toLowerCase()] || "bg-orange-500";
}

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  for (let i = 0; i < full; i++) {
    stars.push(<FaStar key={`full-${i}`} className="text-amber-400 w-3.5 h-3.5" />);
  }
  if (hasHalf) {
    stars.push(<FaStarHalfAlt key="half" className="text-amber-400 w-3.5 h-3.5" />);
  }
  const remaining = 5 - full - (hasHalf ? 1 : 0);
  for (let i = 0; i < remaining; i++) {
    stars.push(<FaStar key={`empty-${i}`} className="text-gray-200 w-3.5 h-3.5" />);
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

function MenuContent() {
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const activeCategory = searchParams.get("category") || "all";
  const searchQuery = (searchParams.get("q") || "").toLowerCase();

  const [items, setItems] = useState<ApiMenuItem[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [addonModalFood, setAddonModalFood] = useState<Food | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<AddonItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [itemsRes, catsRes] = await Promise.all([
          fetch("/api/menu-items"),
          fetch("/api/categories?active=true"),
        ]);
        const itemsData = await itemsRes.json();
        const catsData = await catsRes.json();

        setItems(itemsData.items || []);

        const map: Record<number, string> = {};
        for (const cat of catsData.categories || []) {
          map[cat.id] = cat.slug;
        }
        setCategoryMap(map);
      } catch (err) {
        console.error("Failed to load menu data", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const foods: Food[] = useMemo(() => {
    return items
      .filter((item) => item.isAvailable)
      .map((item) => {
        const basePrice = Number(item.price);
        const discountPct = item.discountPercent ? Number(item.discountPercent) : 0;
        const discountedPrice = discountPct > 0 ? basePrice - (basePrice * discountPct) / 100 : basePrice;
        return {
          id: item.id,
          name: item.title,
          price: basePrice,
          discountedPrice: Math.round(discountedPrice * 100) / 100,
          discountPercent: discountPct,
          image: item.image || "/placeholder.jpg",
          description: item.description || "",
          category: item.categoryId ? categoryMap[item.categoryId] || "uncategorized" : "uncategorized",
          rating: Number(item.rating),
          reviews: item.reviews,
          badge: item.badge || undefined,
          addons: Array.isArray(item.addons) ? item.addons.map((a) => ({ name: a.name, price: Number(a.price) })) : [],
        };
      });
  }, [items, categoryMap]);

  const filtered = useMemo(() => {
    return foods.filter((food) => {
      const matchCategory = activeCategory === "all" || food.category === activeCategory;
      const matchSearch = !searchQuery || food.name.toLowerCase().includes(searchQuery) || food.description.toLowerCase().includes(searchQuery);
      return matchCategory && matchSearch;
    });
  }, [foods, activeCategory, searchQuery]);

  const resultCount = filtered.length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-gray-100 rounded mt-2 animate-pulse" />
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="h-52 bg-gray-100 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {activeCategory === "all" ? "All Items" : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}`}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {resultCount} {resultCount === 1 ? "item" : "items"} available
            {searchQuery && <> for &ldquo;{searchQuery}&rdquo;</>}
          </p>
        </div>
        {resultCount > 0 && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 bg-white/60 px-4 py-2 rounded-lg border border-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtered
          </div>
        )}
      </div>

      {resultCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
          <p className="text-gray-400 text-sm max-w-xs">
            {searchQuery
              ? `We couldn't find anything matching "${searchQuery}"${activeCategory !== "all" ? ` in this category` : ""}.`
              : `No items available in this category yet.`}
          </p>
          <button
            onClick={() => {
              window.history.pushState(null, "", "/menu");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="mt-6 text-sm text-orange-600 hover:text-orange-700 font-medium underline underline-offset-4 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((food) => (
            <div
              key={food.id}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100/50"
            >
              <div className="relative h-52 overflow-hidden">
                <Image
                  src={food.image}
                  alt={food.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                {food.badge && (
                  <span className={`absolute top-3 left-3 ${getBadgeColor(food.badge)} text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-lg`}>
                    {food.badge}
                  </span>
                )}
                {food.discountPercent > 0 && (
                  // change -top-20 to -top-2 to fix this 
                  <div className="absolute -top-20 -right-2 z-10 w-16 h-16 drop-shadow-xl hover:scale-110 transition-transform duration-300">
                    <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="redGradient" x1="20%" y1="10%" x2="80%" y2="90%">
                          <stop offset="0%" stopColor="#FF2222" />
                          <stop offset="100%" stopColor="#B30000" />
                        </linearGradient>
                        <filter id="dropShadow">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.35" />
                        </filter>
                        <filter id="innerShadow">
                          <feOffset dx="0" dy="1" />
                          <feGaussianBlur stdDeviation="0.5" result="offset-blur" />
                          <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                          <feFlood floodColor="black" floodOpacity="0.4" result="color" />
                          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                        </filter>
                      </defs>
                      {/* String outer loop */}
                      <path d="M 1150 700 C 140 10, 185 10, 175 35 C 165 60, 125 78, 125 78"
                        fill="none" stroke="#2B1D1D" strokeWidth="1.5" strokeLinecap="round" />
                      {/* String inner loop */}
                      <path d="M 120 72 C 150 20, 175 25, 165 45 C 155 65, 120 80, 120 80"
                        fill="none" stroke="#2B1D1D" strokeWidth="1.5" strokeLinecap="round" />
                      {/* String knot */}
                      <path d="M 115 70 Q 120 65 125 78" fill="none" stroke="#2B1D1D" strokeWidth="1.5" />
                      {/* Scalloped red badge */}
                      <path d="M 100 20
                        C 112 20 115 28 125 32  C 135 36 142 30 150 38
                        C 158 46 152 53 156 63  C 160 73 168 76 168 88
                        C 168 100 160 103 156 113  C 152 123 158 130 150 138
                        C 142 146 135 140 125 144  C 115 148 112 156 100 156
                        C 88 156 85 148 75 144  C 65 140 58 146 50 138
                        C 42 130 48 123 44 113  C 40 103 32 100 32 88
                        C 32 76 40 73 44 63  C 48 53 42 46 50 38
                        C 58 30 65 36 75 32  C 85 28 88 20 100 20 Z"
                        fill="url(#redGradient)" />
                      {/* Punched hole */}
                      <circle cx="120" cy="74" r="5.5" fill="#ffffff" filter="url(#innerShadow)" />
                      {/* String inside hole */}
                      <path d="M 116 71 L 124 76" stroke="#2B1D1D" strokeWidth="1.2" />
                      {/* Discount text */}
                      <text x="100" y="118" textAnchor="middle" fill="#ffffff"
                        fontSize="26" fontWeight="900" fontFamily="sans-serif"
                        filter="url(#dropShadow)">
                        -{food.discountPercent}%
                      </text>
                    </svg>
                  </div>
                )}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
                  <StarRating rating={food.rating} />
                  <span className="text-[11px] font-semibold text-gray-700 ml-0.5">{food.rating}</span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-lg leading-tight text-gray-900">
                    {food.name}
                  </h3>
                  <span className="text-lg font-bold text-orange-700 whitespace-nowrap tabular-nums">
                    {food.discountedPrice < food.price ? (
                      <>
                        <span className="text-sm line-through text-gray-400 mr-1">Rs. {food.price.toFixed(2)}</span>
                        Rs. {food.discountedPrice.toFixed(2)}
                      </>
                    ) : (
                      <>Rs. {food.price.toFixed(2)}</>
                    )}
                  </span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-4">
                  {food.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">
                    {food.reviews} reviews
                  </span>
                  <button
                    onClick={() => {
                      if (food.addons.length > 0) {
                        setAddonModalFood(food);
                        setSelectedAddons([]);
                      } else {
                        addToCart({
                          id: String(food.id),
                          title: food.name,
                          image: food.image,
                          price: food.discountedPrice,
                          quantity: 1,
                        });
                      }
                    }}
                    className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                  >
                    <FaPlusCircle className="text-xs" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add-ons modal */}
      {addonModalFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-1">{addonModalFood.name}</h2>
            <p className="text-sm text-gray-400 mb-4">Customize your order</p>

            <div className="space-y-3">
              {addonModalFood.addons.map((addon, idx) => {
                const isSelected = selectedAddons.some((a) => a.name === addon.name);
                return (
                  <label
                    key={idx}
                    className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-colors ${isSelected ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div>
                      <p className="font-medium text-sm">{addon.name}</p>
                      <p className="text-xs text-gray-400">+ Rs. {addon.price.toFixed(2)}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAddons([...selectedAddons, addon]);
                        } else {
                          setSelectedAddons(selectedAddons.filter((a) => a.name !== addon.name));
                        }
                      }}
                      className="h-4 w-4 accent-orange-500"
                    />
                  </label>
                );
              })}
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setAddonModalFood(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const addonTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
                  addToCart({
                    id: String(addonModalFood.id),
                    title: addonModalFood.name,
                    image: addonModalFood.image,
                    price: addonModalFood.discountedPrice + addonTotal,
                    quantity: 1,
                    addons: selectedAddons,
                  });
                  setAddonModalFood(null);
                  setSelectedAddons([]);
                }}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm text-white hover:bg-orange-600"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-gray-100 rounded mt-2 animate-pulse" />
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="h-52 bg-gray-100 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}
