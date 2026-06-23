"use client";

import { useEffect, useState } from "react";
import { Heart, Star, ShoppingBag } from "lucide-react";

type Favorite = {
  title: string;
  count: number;
  price: string;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/favorites")
      .then((res) => res.json())
      .then((data) => setFavorites(data.favorites ?? []))
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Favorite Foods</h1>
        <p className="text-gray-400 mt-1">Your most ordered items</p>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <Heart size={64} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Favorites Yet</h2>
          <p className="text-gray-400 mb-6">
            Start ordering and your frequently ordered items will show up here!
          </p>
          <a
            href="/menu"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            <ShoppingBag size={18} />
            Browse Menu
          </a>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((food, index) => (
            <div
              key={food.title}
              className="relative bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all group"
            >
              {index === 0 && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2 shadow-lg">
                  <Star size={16} className="text-white fill-white" />
                </div>
              )}

              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-orange-400 to-red-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Heart size={24} className="text-white fill-white" />
              </div>

              <h3 className="text-lg font-bold text-gray-900">{food.title}</h3>

              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Times ordered</span>
                  <span className="font-semibold text-gray-900">{food.count}x</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Price</span>
                  <span className="font-semibold text-orange-500">RS.{food.price}</span>
                </div>
              </div>

              <div className="mt-4 w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-linear-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min((food.count / Math.max(...favorites.map((f) => f.count))) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">Popularity</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
