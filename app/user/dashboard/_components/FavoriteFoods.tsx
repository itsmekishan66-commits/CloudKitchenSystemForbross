import { Heart, Star } from "lucide-react";

type FavoriteFood = {
  title: string;
  count: number;
  price: string;
};

export default function FavoriteFoods({ favorites }: { favorites: FavoriteFood[] }) {
  if (favorites.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-2xl p-8 shadow-sm border border-zinc-800 text-center">
        <Heart size={48} className="mx-auto text-zinc-600 mb-4" />
        <h2 className="font-bold text-xl mb-2 text-white">Favorite Foods</h2>
        <p className="text-zinc-400">Order some items to see your favorites here!</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-xl text-white">Favorite Foods</h2>
        <span className="text-sm text-zinc-400">Most ordered</span>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {favorites.map((food, index) => (
          <div
            key={food.title}
            className="relative border border-zinc-800 rounded-xl p-4 hover:shadow-md hover:shadow-zinc-800/50 transition-shadow"
          >
            {index === 0 && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1.5 shadow-lg">
                <Star size={14} className="text-white fill-white" />
              </div>
            )}

            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-orange-400 to-red-500 flex items-center justify-center mb-3">
              <Heart size={20} className="text-white fill-white" />
            </div>

            <h3 className="font-semibold text-white">{food.title}</h3>

            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-zinc-400">
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
