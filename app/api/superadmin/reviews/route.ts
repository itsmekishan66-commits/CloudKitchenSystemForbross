import { NextResponse } from "next/server";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminReview, getReviewsByMenuItem } from "@/db/services/reviews";
import { createActivityLog } from "@/db/services/activity-logs";

export const dynamic = "force-dynamic";

function isValidRating(value: number): boolean {
  if (Number.isNaN(value) || value < 1 || value > 5) return false;
  const rounded = Math.round(value * 2) / 2;
  return rounded === value;
}

export async function POST(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.CREATE_MENUS);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const menuItemId = Number(body.menuItemId);
    const rating = Number(body.rating);
    const userName = typeof body.userName === "string" ? body.userName.trim() : "";
    const userAvatar = typeof body.userAvatar === "string" ? body.userAvatar.trim() : null;

    if (!Number.isInteger(menuItemId) || menuItemId <= 0) {
      return NextResponse.json({ error: "Valid menu item id is required" }, { status: 400 });
    }

    if (!userName) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    if (!isValidRating(rating)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5 in 0.5 increments" }, { status: 400 });
    }

    const reviewId = await createAdminReview({
      menuItemId,
      userName,
      userAvatar,
      rating,
    });

    await createActivityLog({
      userId: user.id,
      action: `Added review for menu item #${menuItemId}: "${userName}" rated ${rating}`,
      entityType: "review",
      entityId: reviewId,
    });

    return NextResponse.json({ ok: true, reviewId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create admin review", error);
    return NextResponse.json({ error: "Unable to create review" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.CREATE_MENUS);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const menuItemId = Number(searchParams.get("menuItemId"));

    if (!Number.isInteger(menuItemId) || menuItemId <= 0) {
      return NextResponse.json({ error: "Valid menu item id is required" }, { status: 400 });
    }

    const reviews = await getReviewsByMenuItem(menuItemId);
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Failed to fetch reviews", error);
    return NextResponse.json({ error: "Unable to fetch reviews" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.CREATE_MENUS);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const reviewId = Number(searchParams.get("id"));

    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return NextResponse.json({ error: "Valid review id is required" }, { status: 400 });
    }

    // For admin, we delete by review id directly (bypass user ownership check)
    const { db } = await import("@/db");
    const { reviews } = await import("@/db/schemas");
    const { eq } = await import("drizzle-orm");

    const [existing] = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await db.delete(reviews).where(eq(reviews.id, reviewId));

    // Recalculate rating
    const { recalculateMenuItemRatingAdmin } = await import("@/db/services/reviews");
    await recalculateMenuItemRatingAdmin(existing.menuItemId);

    await createActivityLog({
      userId: user.id,
      action: `Deleted review #${reviewId} from menu item #${existing.menuItemId}`,
      entityType: "review",
      entityId: reviewId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete review", error);
    return NextResponse.json({ error: "Unable to delete review" }, { status: 500 });
  }
}
