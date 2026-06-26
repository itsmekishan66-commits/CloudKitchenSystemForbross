import { ShoppingBag, Heart, Star, TrendingUp } from "lucide-react";
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

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
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
        <StatsCard
          title="Total Spent"
          value={`Rs.${stats.totalSpent.toFixed(2)}`}
          icon={Star}
          gradient="bg-linear-to-br from-orange-200 to-orange-300"
          subtitle="Lifetime"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrders orders={recentOrders} />
        </div>
        <div>
          <ActiveOrder order={activeOrder} />
        </div>
      </div>

      <FavoriteFoods favorites={favorites} />
    </div>
  );
}
