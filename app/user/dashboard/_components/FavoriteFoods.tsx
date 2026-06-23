import { Heart, Star } from "lucide-react";

type FavoriteFood = {
  title: string;
  count: number;
  price: string;
};

export default function FavoriteFoods({ favorites }: { favorites: FavoriteFood[] }) {
  if (favorites.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
        <Heart size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="font-bold text-xl mb-2 text-gray-900">Favorite Foods</h2>
        <p className="text-gray-400">Order some items to see your favorites here!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-xl text-gray-900">Favorite Foods</h2>
        <span className="text-sm text-gray-400">Most ordered</span>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {favorites.map((food, index) => (
          <div
            key={food.title}
            className="relative border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            {index === 0 && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1.5 shadow-lg">
                <Star size={14} className="text-white fill-white" />
              </div>
            )}

            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-orange-400 to-red-500 flex items-center justify-center mb-3">
              <Heart size={20} className="text-white fill-white" />
            </div>

            <h3 className="font-semibold text-gray-900">{food.title}</h3>

            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-400">
                Ordered {food.count} times
              </span>
              <span className="text-sm font-semibold text-orange-500">
                Rs.{food.price}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
