"use client";

import { useEffect, useState } from "react";
import {
  Package,
  ChevronDown,
  ChevronUp,
  Search,
  Clock,
  CookingPot,
  Truck,
  CheckCircle,
  XCircle,
} from "lucide-react";

type OrderItem = {
  id: number;
  title: string;
  quantity: number;
  price: string;
};

type Order = {
  id: number;
  status: string;
  total: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
};

function getStatusStyle(status: string) {
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-700 border-green-200";
    case "Preparing":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "Out For Delivery":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Cancelled":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const icons: Record<string, React.ReactNode> = {
    Pending: <Clock size={14} />,
    Preparing: <CookingPot size={14} />,
    "Out For Delivery": <Truck size={14} />,
    Delivered: <CheckCircle size={14} />,
    Cancelled: <XCircle size={14} />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${getStatusStyle(status)}`}
    >
      {icons[status] ?? <Package size={14} />}
      {status}
    </span>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 overflow-hidden transition-all hover:shadow-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-900/30 flex items-center justify-center">
            <Package size={24} className="text-orange-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white">Order #{order.id}</h4>
            <p className="text-sm text-zinc-400">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="font-semibold text-white">Rs.{order.total}</p>
            <p className="text-xs text-zinc-400 uppercase">{order.paymentMethod}</p>
          </div>
          <StatusBadge status={order.status} />
          {expanded ? (
            <ChevronUp size={20} className="text-zinc-400" />
          ) : (
            <ChevronDown size={20} className="text-zinc-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 px-5 py-4 bg-zinc-800/50">
          <div className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-zinc-800 rounded-xl p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-900/30 flex items-center justify-center text-sm font-bold text-orange-400">
                    {item.quantity}x
                  </div>
                  <span className="font-medium text-white">{item.title}</span>
                </div>
                <span className="text-zinc-400">Rs.{item.price}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-4 pt-3 border-t border-zinc-700">
            <div className="text-sm text-zinc-400 uppercase">{order.paymentMethod}</div>
            <div className="font-bold text-white">
              Total: Rs.{order.total}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetch("/api/user/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toString().includes(search) ||
      order.items.some((item) =>
        item.title.toLowerCase().includes(search.toLowerCase())
      );
    const matchesFilter = filter === "All" || order.status === filter;
    return matchesSearch && matchesFilter;
  });

  const statuses = ["All", "Pending", "Preparing", "Out For Delivery", "Delivered", "Cancelled"];

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
        <h1 className="text-2xl md:text-3xl font-bold text-white">My Orders</h1>
        <p className="text-zinc-400 mt-1">Track and manage all your orders</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search by order ID or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm text-white placeholder-zinc-400"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                filter === s
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-zinc-900 rounded-2xl p-12 shadow-sm border border-zinc-800 text-center">
          <Package size={64} className="mx-auto text-zinc-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Orders Yet</h2>
          <p className="text-zinc-400 mb-6">
            You haven&apos;t placed any orders yet. Browse our menu and order your favorites!
          </p>
          <a
            href="/menu"
            className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            Browse Menu
          </a>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-zinc-900 rounded-2xl p-12 shadow-sm border border-zinc-800 text-center">
          <Search size={48} className="mx-auto text-zinc-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Results</h2>
          <p className="text-zinc-400">
            Try adjusting your search or filter
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
