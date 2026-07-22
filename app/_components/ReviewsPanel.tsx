"use client";

import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";

type Review = {
  id: number;
  rating: string;
  comment: string | null;
  createdAt: string;
  userId: number | null;
  userName: string;
  userAvatar: string | null;
};

function StarDisplay({ rating }: { rating: number }) {
  const stars = [];
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  for (let i = 0; i < full; i++) {
    stars.push(<Star key={`full-${i}`} size={14} className="fill-amber-400 text-amber-400" />);
  }
  if (hasHalf) {
    stars.push(
      <span key="half" className="relative inline-block w-3.5 h-3.5">
        <Star size={14} className="text-gray-600 absolute inset-0" />
        <span className="absolute inset-0 overflow-hidden w-[50%]">
          <Star size={14} className="fill-amber-400 text-amber-400" />
        </span>
      </span>
    );
  }
  const remaining = 5 - full - (hasHalf ? 1 : 0);
  for (let i = 0; i < remaining; i++) {
    stars.push(<Star key={`empty-${i}`} size={14} className="text-gray-600" />);
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ReviewsPanel({
  menuItemId,
  menuTitle,
  onClose,
}: {
  menuItemId: number;
  menuTitle?: string;
  onClose: () => void;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reviews?menuItemId=${menuItemId}`)
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews ?? []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [menuItemId]);

  //to make always 3.5 rating regardless of the user review, if avgerage calulation is above 3.5 only then average shows else always 3.5
  const avgRating =
    reviews.length > 0
      ? Math.max(3.5, reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length)
      : 3.5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg max-h-[80vh] rounded-2xl bg-gray-800 shadow-xl border border-gray-700 flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-bold text-white">
              {menuTitle ? `Reviews for "${menuTitle}"` : "Reviews"}
            </h3>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <StarDisplay rating={avgRating} />
                <span className="text-sm text-gray-400">
                  {avgRating.toFixed(1)} ({reviews.length === 1 ? "review" : "reviews"})
                </span>
              </div>
            )}
          </div>
          <div className="flex shrink-0 overflow-y-auto "></div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between bg-gray-700/50 rounded-xl p-4 border border-gray-600/50"
                >
                  <div className="flex items-center gap-3">
                    {review.userAvatar ? (
                      <img src={review.userAvatar} alt={review.userName} className="w-9 h-9 rounded-full object-cover border border-gray-600" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center text-sm font-bold text-orange-400">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">
                        {review.userName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StarDisplay rating={Number(review.rating)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}