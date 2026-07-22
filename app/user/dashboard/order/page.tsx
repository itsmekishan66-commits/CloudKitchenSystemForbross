"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Search,
  Clock,
  CookingPot,
  Truck,
  CheckCircle,
  XCircle,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";

type OrderItem = {
  id: number;
  menuItemId: number | null;
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

function RatingModal({
  menuItemId,
  menuItemTitle,
  onClose,
  onSubmitted,
}: {
  menuItemId: number;
  menuItemTitle: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to submit rating");
        return;
      }
      toast.success("Rating submitted!");
      onSubmitted();
      onClose();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Rate &ldquo;{menuItemTitle}&rdquo;
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          How was this item? Leave a star rating and optional comment.
        </p>

        {/* Star picker with half-star support */}
        <div className="flex items-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((star) => {
            const activeVal = hovered || rating;
            const isFull = activeVal >= star;
            const isHalf = !isFull && activeVal >= star - 0.5;
            return (
              <div key={star} className="relative w-7 h-7">
                <button
                  type="button"
                  onMouseEnter={() => setHovered(star - 0.5)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star - 0.5)}
                  className="absolute left-0 top-0 w-1/2 h-full z-20 cursor-pointer"
                />
                <button
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="absolute right-0 top-0 w-1/2 h-full z-20 cursor-pointer"
                />
                <Star size={28} className="absolute inset-0 text-gray-300" />
                {isFull && (
                  <Star size={28} className="absolute inset-0 fill-amber-400 text-amber-400" />
                )}
                {isHalf && (
                  <span className="absolute inset-0 overflow-hidden w-[50%]">
                    <Star size={28} className="fill-amber-400 text-amber-400" />
                  </span>
                )}
              </div>
            );
          })}
          {rating > 0 && (
            <span className="ml-2 text-sm font-medium text-gray-600">
              {rating}/5
            </span>
          )}
        </div>

        {/* Comment */}
        <textarea
          placeholder="Add a comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none mb-4"
        />

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating < 1}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onReviewSubmitted,
  userReviews,
}: {
  order: Order;
  onReviewSubmitted: () => void;
  userReviews: Map<number, number>;
}) {
  const [ratingModal, setRatingModal] = useState<{
    menuItemId: number;
    title: string;
  } | null>(null);

  return (
    <div className="bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 overflow-hidden transition-all hover:shadow-md">
      <div className="p-5 flex items-center justify-between">
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
        </div>
      </div>

      {order.items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between px-5 py-3 border-t border-zinc-800"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-900/30 flex items-center justify-center text-sm font-bold text-orange-400">
              {item.quantity}x
            </div>
            <span className="font-medium text-white">{item.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-zinc-400">Rs.{item.price}</span>
            {order.status === "Delivered" && item.menuItemId && (
              <button
                onClick={() => {
                  if (userReviews.has(item.menuItemId!)) {
                    toast.error("You have already reviewed this item");
                    return;
                  }
                  setRatingModal({
                    menuItemId: item.menuItemId!,
                    title: item.title,
                  });
                }}
                className="flex items-center gap-0.5 cursor-pointer group"
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const userRating = userReviews.get(item.menuItemId!) ?? 0;
                  const isFilled = star <= userRating;
                  return (
                    <Star
                      key={star}
                      size={22}
                      className={
                        isFilled
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-600 group-hover:text-amber-400 transition-colors"
                      }
                    />
                  );
                })}
              </button>
            )}
          </div>
        </div>
      ))}

      {ratingModal && (
        <RatingModal
          menuItemId={ratingModal.menuItemId}
          menuItemTitle={ratingModal.title}
          onClose={() => setRatingModal(null)}
          onSubmitted={onReviewSubmitted}
        />
      )}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [refreshKey, setRefreshKey] = useState(0);
  const [userReviews, setUserReviews] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    fetch("/api/user/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  useEffect(() => {
    fetch("/api/reviews?userId=me")
      .then((res) => res.json())
      .then((data) => {
        const map = new Map<number, number>();
        for (const r of data.reviews ?? []) {
          map.set(r.menuItemId, r.rating);
        }
        setUserReviews(map);
      })
      .catch(() => setUserReviews(new Map()));
  }, [refreshKey]);

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
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === s
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
            <OrderCard
              key={order.id}
              order={order}
              onReviewSubmitted={() => setRefreshKey((k) => k + 1)}
              userReviews={userReviews}
            />
          ))}
        </div>
      )}
    </div>
  );
}