import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createReview, getUserReviewForMenuItem, getUserReviews, getReviewsByMenuItem } from "@/db/services/reviews";

export const dynamic = "force-dynamic";

function isValidRating(value: number): boolean {
  if (Number.isNaN(value) || value < 1 || value > 5) return false;
  const rounded = Math.round(value * 2) / 2;
  return rounded === value;
}

type ReviewPayload = {
  menuItemId?: number;
  rating?: number;
  comment?: string;
};

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: ReviewPayload;

  try {
    payload = (await request.json()) as ReviewPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const menuItemId = Number(payload.menuItemId);
  const rating = Number(payload.rating);
  const comment =
    typeof payload.comment === "string" ? payload.comment.trim() : "";

  if (!Number.isInteger(menuItemId) || menuItemId <= 0) {
    return NextResponse.json(
      { error: "A valid menu item id is required" },
      { status: 400 }
    );
  }

  if (!isValidRating(rating)) {
    return NextResponse.json(
      { error: "Rating must be between 1 and 5 in 0.5 increments" },
      { status: 400 }
    );
  }

  const existing = await getUserReviewForMenuItem(user.id, menuItemId);
  if (existing) {
    return NextResponse.json(
      { error: "You have already rated this item" },
      { status: 409 }
    );
  }

  try {
    await createReview({
      userId: user.id,
      menuItemId,
      rating: String(rating),
      comment: comment || null,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to create review", error);
    return NextResponse.json(
      { error: "Unable to submit review" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userIdParam = searchParams.get("userId");
  const menuItemId = Number(searchParams.get("menuItemId"));

  if (userIdParam === "me") {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const reviews = await getUserReviews(user.id);
      return NextResponse.json({ reviews });
    } catch (error) {
      console.error("Failed to fetch user reviews", error);
      return NextResponse.json(
        { error: "Unable to fetch reviews" },
        { status: 500 }
      );
    }
  }

  if (!Number.isInteger(menuItemId) || menuItemId <= 0) {
    return NextResponse.json(
      { error: "A valid menu item id is required" },
      { status: 400 }
    );
  }

  try {
    const reviews = await getReviewsByMenuItem(menuItemId);
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Failed to fetch reviews", error);
    return NextResponse.json(
      { error: "Unable to fetch reviews" },
      { status: 500 }
    );
  }
}