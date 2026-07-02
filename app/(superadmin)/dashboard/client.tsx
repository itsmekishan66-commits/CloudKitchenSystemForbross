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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-red-50 p-6 no-scrollbar">
      <div className="rounded-3xl bg-orange-300 p-8 text-black shadow-2xl">
        <h1 className="text-4xl font-bold">{siteName} Command Center</h1>
        <p className="mt-3 max-w-3xl text-black/90">
          Monitor orders, kitchens, inventory, payments, customers, staff, and business performance from a single powerful dashboard.
        </p>
        <div className="mt-6 flex gap-3 flex-wrap">
          {can("/dashboard/reports") ? <Link href="/dashboard/reports" className="rounded-xl bg-white px-5 py-3 font-semibold text-red-600">View Reports</Link> : null}
          {can("/dashboard/settings") ? <Link href="/dashboard/settings" className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 backdrop-blur-lg">System Settings</Link> : null}
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {statCards.filter((s) => can(s.module)).map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="rounded-3xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">{stat.title}</p>
                  <h2 className="mt-2 text-3xl font-bold">{stat.value}</h2>
                  <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">{stat.growth}</span>
                </div>
                <div className="rounded-2xl bg-orange-100 p-4">
                  <Icon size={28} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10">
        <h2 className="mb-5 text-2xl font-bold">Quick Access</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.name}
                href={module.href}
                className="cursor-pointer rounded-3xl border border-white/20 bg-white/80 p-6 shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl backdrop-blur-xl"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-semibold">{module.name}</h3>
                <p className="mt-2 text-sm text-gray-500">Manage and monitor {module.name.toLowerCase()}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {can("/dashboard/orders") || can("/dashboard/menu") || can("/dashboard/customers") || can("/dashboard/kitchen") ? (
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {can("/dashboard/orders") ? (
            <div className="lg:col-span-2 rounded-3xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
              <h2 className="mb-5 text-xl font-bold">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 text-left">Order ID</th>
                      <th className="py-3 text-left">Customer</th>
                      <th className="py-3 text-left">Status</th>
                      <th className="py-3 text-left">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.recentOrders ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400">No orders yet</td>
                      </tr>
                    ) : (
                      stats?.recentOrders.map((order) => (
                        <tr key={order.id} className="border-b">
                          <td className="py-4">#{order.id}</td>
                          <td>{order.customerName}</td>
                          <td>
                            <span className={`rounded-full px-3 py-1 text-sm ${statusColors[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>Rs.{order.total}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="rounded-3xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
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
          <div className="rounded-3xl bg-red-50 p-6 shadow-lg">
            <h2 className="text-lg font-bold text-red-600">Pending Orders</h2>
            <p className="mt-4 text-4xl font-bold text-red-600">{stats?.pendingOrders ?? 0}</p>
            <p className="mt-2 text-gray-600">Orders awaiting processing</p>
          </div>
        ) : null}

        {can("/dashboard/payment") ? (
          <div className="rounded-3xl bg-green-50 p-6 shadow-lg">
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
