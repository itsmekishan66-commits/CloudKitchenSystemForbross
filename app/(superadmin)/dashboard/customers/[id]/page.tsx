import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, roles } from "@/db/schemas";
import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import { getUserOrdersWithItems, getUserOrderStats } from "@/db/services/orders";
import { ArrowLeft, ShoppingBag, Wallet, TrendingUp, Star } from "lucide-react";
import Link from "next/link";
import OrderHistory from "./OrderHistory";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.VIEW_USERS);

  const { id } = await params;
  const userId = Number(id);
  if (isNaN(userId)) notFound();

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      address: users.address,
      isGuest: users.isGuest,
      creditBalance: users.creditBalance,
      createdAt: users.createdAt,
      role: roles.name,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(and(eq(users.id, userId), eq(users.deleted, false)))
    .limit(1);

  if (!user) notFound();

  const [stats, orders] = await Promise.all([
    getUserOrderStats(userId),
    getUserOrdersWithItems(userId),
  ]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/dashboard/customers"
          className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 shrink-0"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-gray-500">
            {user.role} {user.isGuest ? "(Guest)" : ""} &middot; Joined{" "}
            {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-linear-to-br from-orange-400 to-orange-300 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-black/80">Total Orders</p>
            <ShoppingBag size={20} className="text-black/60" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.totalOrders}</p>
        </div>
        <div className="rounded-2xl bg-linear-to-br from-orange-400 to-orange-300 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-black/80">Total Spent</p>
            <Wallet size={20} className="text-black/60" />
          </div>
          <p className="text-2xl font-bold mt-2">Rs.{stats.totalSpent.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl bg-linear-to-br from-orange-400 to-orange-300 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-black/80">Total Saved</p>
            <Star size={20} className="text-black/60" />
          </div>
          <p className="text-2xl font-bold mt-2">Rs.{stats.totalSaved.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl bg-linear-to-br from-orange-400 to-orange-300 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-black/80">Credit Balance</p>
            <Wallet size={20} className="text-black/60" />
          </div>
          <p className="text-2xl font-bold mt-2">Rs.{stats.creditBalance.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl bg-linear-to-br from-orange-400 to-orange-300 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-black/80">Active Orders</p>
            <TrendingUp size={20} className="text-black/60" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.activeOrders}</p>
        </div>
        <div className="rounded-2xl bg-linear-to-br from-orange-400 to-orange-300 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-black/80">Total Dues</p>
            <Wallet size={20} className="text-black/60" />
          </div>
          {stats.totalDues > 0 && (
            <p className="text-md text-black font-bold mt-2 inline-block rounded-full">
              Rs.{stats.totalDues.toFixed(2)} dues pending
            </p>
          )}        </div>
      </div>

      {/* Customer Info */}
      <div className="rounded-2xl bg-white border border-gray-100 p-5">
        <h3 className="font-semibold text-sm mb-3">Customer Information</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Email:</span>
            <p className="font-medium">{user.email ?? "-"}</p>
          </div>
          <div>
            <span className="text-gray-400">Phone:</span>
            <p className="font-medium">{user.phone ?? "-"}</p>
          </div>
          <div>
            <span className="text-gray-400">Address:</span>
            <p className="font-medium">{user.address ?? "-"}</p>
          </div>
          <div>
            <span className="text-gray-400">Role:</span>
            <p className="font-medium capitalize">{user.role}</p>
          </div>
          <div>
            {/* <span className="text-gray-400">Credit Balance:</span>
            <p className="font-medium">Rs.{Number(user.creditBalance ?? 0).toFixed(2)}</p> */}
          </div>
        </div>
      </div>

      {/* Orders History */}
      <OrderHistory orders={orders} />
    </div>
  );
}
