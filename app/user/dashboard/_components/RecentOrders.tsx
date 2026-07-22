"use client";
import { useEffect, useState } from "react";
import { Package, Star } from "lucide-react";
import toast from "react-hot-toast";

type OrderItem = {
  title: string;
  quantity: number;
  menuItemId: number | null;
};

type Order = {
  id: number;
  status: string;
  total: string;
  createdAt: string | Date;
  items: OrderItem[];
};

function getStatusStyle(status: string) {
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-700";
    case "Preparing":
      return "bg-yellow-100 text-yellow-700";
    case "Out For Delivery":
      return "bg-blue-100 text-blue-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatDate(dateStr: string | Date) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
    if (rating < 1) {
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

export default function RecentOrders({ orders }: { orders: Order[] }) {
  const [page, setPage] = useState(1);
  const [ratingModal, setRatingModal] = useState<{
    menuItemId: number;
    title: string;
  } | null>(null);
  const [userReviews, setUserReviews] = useState<Map<number, number>>(new Map());
  const [refreshKey, setRefreshKey] = useState(0);
  const perPage = 7;
  const totalPages = Math.ceil(orders.length / perPage);
  const start = (page - 1) * perPage;
  const visibleOrders = orders.slice(start, start + perPage);

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

  if (orders.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-2xl p-8 shadow-sm border border-zinc-800 text-center">
        <Package size={48} className="mx-auto text-zinc-600 mb-4" />
        <h2 className="font-bold text-xl mb-2 text-white">Recent Orders</h2>
        <p className="text-zinc-400">No orders yet. Start ordering your favorite meals!</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-xl text-white">Recent Orders</h2>
        <span className="text-sm text-zinc-400">{orders.length} orders</span>
      </div>

      <div className="space-y-1">
        {visibleOrders.map((order) => (
          <div key={order.id} className="rounded-xl hover:bg-zinc-800 transition-colors">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-900/30 flex items-center justify-center">
                  <Package size={20} className="text-orange-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">
                    {order.items.map((i) => i.title).join(", ")}
                  </h4>
                  <p className="text-sm text-zinc-400">
                    #{order.id} &bull; {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-white">Rs.{order.total}</p>
                <span
                  className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium mt-1 ${getStatusStyle(order.status)}`}
                >
                  {order.status}
                </span>
              </div>
            </div>

            {order.status === "Delivered" && (
              <div className="flex flex-wrap gap-3 px-4 pb-3">
                {order.items.map((item, idx) =>
                  item.menuItemId ? (
                    <button
                      key={idx}
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
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer group"
                    >
                      <span className="text-xl text-zinc-400 group-hover:text-white transition-colors bg-zinc-800 rounded-xl p-1">{item.quantity}x</span>
                      <span className="text-xl text-zinc-400 group-hover:text-white transition-colors">{item.title}</span>
                      <span className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const userRating = userReviews.get(item.menuItemId!) ?? 0;
                          const isFilled = star <= userRating;
                          return (
                            <Star
                              key={star}
                              size={20}
                              className={
                                isFilled
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-zinc-600 group-hover:text-amber-400 transition-colors"
                              }
                            />
                          );
                        })}
                      </span>
                    </button>
                  ) : null
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-800">
          <p className="text-sm text-zinc-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {ratingModal && (
        <RatingModal
          menuItemId={ratingModal.menuItemId}
          menuItemTitle={ratingModal.title}
          onClose={() => setRatingModal(null)}
          onSubmitted={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}