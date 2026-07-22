import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateReview, deleteReview } from "@/db/services/reviews";

export const dynamic = "force-dynamic";

function isValidRating(value: number): boolean {
  if (Number.isNaN(value) || value < 1 || value > 5) return false;
  const rounded = Math.round(value * 2) / 2;
  return rounded === value;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reviewId = Number(id);

  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return NextResponse.json(
      { error: "Invalid review ID" },
      { status: 400 }
    );
  }

  let payload: { rating?: number; comment?: string };

  try {
    payload = (await request.json()) as { rating?: number; comment?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: { rating?: number; comment?: string } = {};

  if (payload.rating !== undefined) {
    const rating = Number(payload.rating);
    if (!isValidRating(rating)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5 in 0.5 increments" },
        { status: 400 }
      );
    }
    updates.rating = rating;
  }

  if (payload.comment !== undefined) {
    updates.comment = typeof payload.comment === "string" ? payload.comment.trim() : "";
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  try {
    const updated = await updateReview(reviewId, user.id, updates);
    if (!updated) {
      return NextResponse.json(
        { error: "Review not found or unauthorized" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update review", error);
    return NextResponse.json(
      { error: "Unable to update review" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reviewId = Number(id);

  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return NextResponse.json(
      { error: "Invalid review ID" },
      { status: 400 }
    );
  }

  try {
    const deleted = await deleteReview(reviewId, user.id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Review not found or unauthorized" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete review", error);
    return NextResponse.json(
      { error: "Unable to delete review" },
      { status: 500 }
    );
  }
}