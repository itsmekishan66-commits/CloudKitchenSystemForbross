import { ShoppingBag, Heart, TrendingUp, Wallet } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getUserOrderStats, getUserOrdersWithItems, getUserActiveOrder, getUserFavoriteItems, } from "@/db/services/orders";
import { redirect } from "next/navigation";
import DashboardHeader from "./_components/DashboardHeader";
import StatsCard from "./_components/StatsCard";
import RecentOrders from "./_components/RecentOrders";
import ActiveOrder from "./_components/ActiveOrder";
import FavoriteFoods from "./_components/FavoriteFoods";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [stats, orders, activeOrder, favorites] = await Promise.all([
    getUserOrderStats(user.id),
    getUserOrdersWithItems(user.id),
    getUserActiveOrder(user.id),
    getUserFavoriteItems(user.id),
  ]);

  return (
    <div className="md:space-y-6">
      <DashboardHeader name={user.name} email={user.email} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
          gradient="bg-linear-to-br from-orange-200 to-orange-300"
          subtitle="All time"
        />
        <StatsCard
          title="Active Orders"
          value={stats.activeOrders}
          icon={TrendingUp}
          gradient="bg-linear-to-br from-orange-200 to-orange-300"
          subtitle="In progress"
        />
        <StatsCard
          title="Favorite Items"
          value={favorites.length}
          icon={Heart}
          gradient="bg-linear-to-br from-orange-200 to-orange-300"
          subtitle="Most ordered"
        />
        <div className="relative overflow-hidden rounded-2xl p-6 bg-linear-to-br from-orange-200 to-orange-300 shadow-lg transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-black/80">Total Spending</p>
              <Wallet size={24} className="text-black/60" />
            </div>
            <p className="text-3xl font-bold mt-3">Rs.{stats.totalSpent.toFixed(2)}</p>
            {stats.totalSaved > 0 && (
              <>
                <p className="text-sm text-black/70 mt-1">
                  After Discount: <span className="font-semibold">Rs.{(stats.totalSpent - stats.totalSaved).toFixed(2)}</span>
                </p>
                <p className="text-xs text-green-800 font-medium mt-1 bg-green-200/50 inline-block px-2 py-0.5 rounded-full">
                  Saved Rs.{stats.totalSaved.toFixed(2)}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrders orders={orders} />
        </div>
        <div>
          <ActiveOrder order={activeOrder} />
        </div>
      </div>

      <FavoriteFoods favorites={favorites} />
    </div>
  );
}
