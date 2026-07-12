"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag, IndianRupee, Users, UtensilsCrossed, ClipboardList, Package, CreditCard, LifeBuoy, BarChart3,
  Megaphone, Settings, ShieldCheck, Tags, MessageSquare,
} from "lucide-react";

interface DashboardStats {
  totalOrders: number;
  revenue: number;
  totalCustomers: number;
  totalMenuItems: number;
  activeKitchens: number;
  totalAdmins: number;
  pendingOrders: number;
  recentOrders: Array<{
    id: number;
    customerName: string;
    status: string;
    total: string;
    createdAt: string;
  }>;
}
//yo ho to hide the sections of the dashboard
interface DashboardClientProps {
  allowedModules: string[];
}

export default function DashboardClient({ allowedModules }: DashboardClientProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [siteName, setSiteName] = useState("Cloud Kitchen");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const can = (module: string) => allowedModules.includes(module);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error && data.siteName) setSiteName(data.siteName);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    fetch("/api/superadmin/stats")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setStats(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats
    ? [
      { title: "Total Orders", value: stats.totalOrders.toLocaleString(), growth: `${stats.pendingOrders} pending`, icon: ShoppingBag, module: "/dashboard/orders" },
      { title: "Revenue", value: `Rs.${(stats.revenue / 1000).toFixed(1)}K`, growth: "Total revenue", icon: IndianRupee, module: "/dashboard/payment" },
      { title: "Customers", value: stats.totalCustomers.toLocaleString(), growth: "Registered users", icon: Users, module: "/dashboard/customers" },
      { title: "Active Kitchens", value: stats.activeKitchens.toString(), growth: "Currently active", icon: UtensilsCrossed, module: "/dashboard/kitchen" },
    ]
    : [];

  //yo ho to hide the sections of the dashboard
  const allmodules = [
    // const modules = [
    { name: "Orders", icon: ShoppingBag, href: "/dashboard/orders" },
    { name: "Customers", icon: Users, href: "/dashboard/customers" },
    { name: "Guest Users", icon: Users, href: "/dashboard/guest-users" },
    { name: "Kitchen", icon: UtensilsCrossed, href: "/dashboard/kitchen" },
    { name: "Menu", icon: ClipboardList, href: "/dashboard/menu" },
    { name: "Categories", icon: Tags, href: "/dashboard/categories" },
    { name: "Inventory", icon: Package, href: "/dashboard/inventory" },
    { name: "Payments", icon: CreditCard, href: "/dashboard/payment" },
    { name: "Support", icon: LifeBuoy, href: "/dashboard/support" },
    { name: "Messages", icon: MessageSquare, href: "/dashboard/messages" },
    { name: "Reports", icon: BarChart3, href: "/dashboard/reports" },
    { name: "Promotions", icon: Megaphone, href: "/dashboard/promotions" },
    { name: "Settings", icon: Settings, href: "/dashboard/settings" },
    { name: "Roles", icon: ShieldCheck, href: "/dashboard/roles" },
  ];

  //yo ho to hide the sections of the dashboard
  const modules = allmodules.filter((m) => allowedModules.includes(m.href));

  const statusColors: Record<string, string> = {
    Pending: "bg-yellow-100 text-yellow-700",
    Preparing: "bg-blue-100 text-blue-700",
    "Out For Delivery": "bg-purple-100 text-purple-700",
    Delivered: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
  };

  const moduleColors: Record<string, string> = {
    "/dashboard/orders": "from-blue-500 to-indigo-600",
    "/dashboard/customers": "from-purple-500 to-fuchsia-600",
    "/dashboard/guest-users": "from-pink-500 to-rose-600",
    "/dashboard/kitchen": "from-orange-500 to-amber-600",
    "/dashboard/menu": "from-emerald-500 to-green-600",
    "/dashboard/categories": "from-teal-500 to-cyan-600",
    "/dashboard/inventory": "from-violet-500 to-purple-600",
    "/dashboard/payment": "from-green-500 to-emerald-600",
    "/dashboard/support": "from-sky-500 to-blue-600",
    "/dashboard/messages": "from-rose-500 to-pink-600",
    "/dashboard/reports": "from-indigo-500 to-blue-600",
    "/dashboard/promotions": "from-red-500 to-orange-600",
    "/dashboard/settings": "from-slate-500 to-gray-600",
    "/dashboard/roles": "from-amber-500 to-yellow-600",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-red-50 p-3 sm:p-6 no-scrollbar">
      <div className="rounded-2xl sm:rounded-3xl bg-orange-300 p-5 sm:p-8 text-black shadow-2xl">
        <h1 className="text-2xl sm:text-4xl font-bold">{siteName} Command Center</h1>
        <p className="mt-2 sm:mt-3 max-w-3xl text-black/90 text-sm sm:text-base">
          Monitor orders, kitchens, inventory, payments, customers, staff, and business performance from a single powerful dashboard.
        </p>
        <div className="mt-6 flex gap-3 flex-wrap">
          {can("/dashboard/reports") ? <Link href="/dashboard/reports" className="rounded-xl bg-white px-5 py-3 font-semibold text-red-600">View Reports</Link> : null}
          {can("/dashboard/settings") ? <Link href="/dashboard/settings" className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 backdrop-blur-lg">System Settings</Link> : null}
        </div>
      </div>

      <div className="mt-4 md:mt-8 grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {statCards.filter((s) => can(s.module)).map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.title} className="rounded-2xl sm:rounded-3xl border border-white/20 bg-white/80 p-4 sm:p-5 lg:p-6 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs sm:text-sm text-gray-500"> {stat.title} </p>
                  <h2 className="mt-1 text-xl sm:text-2xl lg:text-3xl font-bold"> {stat.value} </h2>
                  <span className="mt-2 inline-flex rounded-full bg-green-100 px-2 py-1 text-[10px] sm:text-xs lg:text-sm text-green-700"> {stat.growth} </span>
                </div>
                <div className={`rounded-xl sm:rounded-2xl bg-linear-to-br ${moduleColors[stat.module] ?? "from-orange-500 to-orange-600"} p-2 sm:p-3 lg:p-4 shrink-0`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 md:mt-10">
        <h2 className="mb-4 sm:mb-5 text-xl sm:text-2xl font-bold"> Quick Access </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.name} href={module.href}
                className="group rounded-2xl sm:rounded-3xl border border-white/20 bg-white/80 p-3 sm:p-5 lg:p-6 shadow-lg backdrop-blur-xl transition-all hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-2xl">
                <div className={`mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-linear-to-br ${moduleColors[module.href] ?? "from-orange-500 to-orange-600"} transition-colors group-hover:brightness-110`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold leading-tight"> {module.name} </h3>
                <p className="mt-1 sm:mt-2 text-[11px] sm:text-sm text-gray-500 leading-relaxed">  Manage and monitor {module.name.toLowerCase()} </p>
              </Link>
            );
          })}
        </div>
      </div>

      {can("/dashboard/orders") || can("/dashboard/menu") || can("/dashboard/customers") || can("/dashboard/kitchen") ? (
        <div className="mt-8 sm:mt-10 grid gap-4 sm:gap-6 lg:grid-cols-3">
          {can("/dashboard/orders") ? (
            <div className="lg:col-span-2 rounded-3xl border border-white/20 bg-white/80 p-4 sm:p-5 lg:p-6 shadow-xl backdrop-blur-xl">
              <h2 className="mb-4 sm:mb-5 text-lg sm:text-xl font-bold">Recent Orders</h2>
              <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-[12px] md:text-xl">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 text-left">Order ID</th>
                      <th className="py-3 text-left">Customer</th>
                      <th className="py-3 text-left">Status</th>
                      <th className="py-3 text-left">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const orders = stats?.recentOrders ?? [];
                      const start = (page - 1) * perPage;
                      const visibleOrders = orders.slice(start, start + perPage);
                      if (visibleOrders.length === 0) {
                        return (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-gray-400">No orders yet</td>
                          </tr>
                        );
                      }
                      return visibleOrders.map((order) => (
                        <tr key={order.id} className="border-b">
                          <td className="py-4">#{order.id}</td>
                          <td>{order.customerName}</td>
                          <td>
                            <span className={`rounded-full px-3 py-1 text-[10px] md:text-xs ${statusColors[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>Rs.{order.total}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
              {(() => {
                const orders = stats?.recentOrders ?? [];
                const totalPages = Math.ceil(orders.length / perPage);
                if (totalPages <= 1) return null;
                return (
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Page {page} of {totalPages} ({orders.length} orders)
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : null}

          <div className="rounded-3xl border border-white/20 bg-white/80 p-p-4 sm:p-5 lg:p-6 shadow-xl backdrop-blur-xl">
            <h2 className="mb-5 text-xl font-bold">Quick Stats</h2>
            <div className="space-y-5">
              {can("/dashboard/menu") ? (
                <div className="flex gap-3">
                  <div className="mt-2 h-3 w-3 rounded-full bg-green-500" />
                  <p className="text-sm text-gray-700">Total Menu Items: {stats?.totalMenuItems ?? 0}</p>
                </div>
              ) : null}
              {can("/dashboard/orders") ? (
                <div className="flex gap-3">
                  <div className="mt-2 h-3 w-3 rounded-full bg-blue-500" />
                  <p className="text-sm text-gray-700">Pending Orders: {stats?.pendingOrders ?? 0}</p>
                </div>
              ) : null}
              {can("/dashboard/customers") ? (
                <div className="flex gap-3">
                  <div className="mt-2 h-3 w-3 rounded-full bg-purple-500" />
                  <p className="text-sm text-gray-700">Admins & Staff: {stats?.totalAdmins ?? 0}</p>
                </div>
              ) : null}
              {can("/dashboard/kitchen") ? (
                <div className="flex gap-3">
                  <div className="mt-2 h-3 w-3 rounded-full bg-orange-500" />
                  <p className="text-sm text-gray-700">Active Kitchens: {stats?.activeKitchens ?? 0}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {can("/dashboard/orders") ? (
          <div className="rounded-3xl bg-red-50 p-4 sm:p-5 lg:p-6 shadow-lg">
            <h2 className="text-lg font-bold text-red-600">Pending Orders</h2>
            <p className="mt-4 text-4xl font-bold text-red-600">{stats?.pendingOrders ?? 0}</p>
            <p className="mt-2 text-gray-600">Orders awaiting processing</p>
          </div>
        ) : null}

        {can("/dashboard/payment") ? (
          <div className="rounded-3xl bg-green-50 p-4 sm:p-5 lg:p-6 shadow-lg">
            <h2 className="text-lg font-bold text-green-600">Revenue</h2>
            <p className="mt-4 text-4xl font-bold text-green-600">Rs.{(stats?.revenue ?? 0).toLocaleString() ?? 0}</p>
            <p className="mt-2 text-gray-600">Total revenue from all orders</p>
          </div>
        ) : null}

        {can("/dashboard/customers") ? (
          <div className="rounded-3xl bg-blue-50 p-6 shadow-lg">
            <h2 className="text-lg font-bold text-blue-600">Users & Roles</h2>
            <div className="mt-4 space-y-2">
              <p>Customers: {stats?.totalCustomers ?? 0}</p>
              <p>Admins & Staff: {stats?.totalAdmins ?? 0}</p>
              <p>Active Kitchens: {stats?.activeKitchens ?? 0}</p>
              <p>Menu Items: {stats?.totalMenuItems ?? 0}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
