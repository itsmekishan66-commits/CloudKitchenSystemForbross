import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, roles } from "@/db/schemas";
import { requirePermission } from "@/lib/requirePermission";
import { PERMISSIONS } from "@/lib/permissions";
import { getUserOrdersWithItems, getUserOrderStats } from "@/db/services/orders";
import { ArrowLeft, ShoppingBag, Wallet, TrendingUp, Star } from "lucide-react";
import Link from "next/link";

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
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) notFound();

  const [stats, orders] = await Promise.all([
    getUserOrderStats(userId),
    getUserOrdersWithItems(userId),
  ]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/customers"
          className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-gray-500">
            {user.role} {user.isGuest ? "(Guest)" : ""} &middot; Joined{" "}
            {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
          {stats.totalDues > 0 && (
            <p className="text-xs text-amber-800 font-medium mt-2 bg-amber-200/50 inline-block px-2 py-0.5 rounded-full">
              Includes Rs.{stats.totalDues.toFixed(2)} dues pending
            </p>
          )}
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
      </div>

      {/* Customer Info */}
      <div className="rounded-2xl bg-white border border-gray-100 p-5">
        <h3 className="font-semibold text-sm mb-3">Customer Information</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
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
            <span className="text-gray-400">Credit Balance:</span>
            <p className="font-medium">Rs.{Number(user.creditBalance ?? 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Orders History */}
      <div className="rounded-2xl bg-white border border-gray-100 p-5">
        <h3 className="font-semibold text-sm mb-4">Order History ({orders.length})</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No orders yet</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">#{order.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      order.status === "Delivered" ? "bg-green-100 text-green-700" :
                      order.status === "Cancelled" ? "bg-red-100 text-red-700" :
                      order.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                      order.status === "Preparing" ? "bg-blue-100 text-blue-700" :
                      "bg-purple-100 text-purple-700"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Rs.{order.total}</p>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Payment: {order.paymentMethod} &middot; Delivery: Rs.{order.deliveryCharge}</p>
                  {Number(order.discountAmount) > 0 && (
                    <p className="text-green-600">Discount: Rs.{order.discountAmount}</p>
                  )}
                  {Number(order.dueAmount) > 0 && (
                    <p className="text-amber-600">Due: Rs.{order.dueAmount}</p>
                  )}
                </div>
                <details className="mt-2">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                    Items ({order.items.length})
                  </summary>
                  <div className="mt-1 space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs text-gray-600 pl-3">
                        <span>{item.title} × {item.quantity}</span>
                        <span>Rs.{(Number(item.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
