import { and, eq, sql, desc } from "drizzle-orm";

import { db } from "@/db";
import { menuItems, reviews, users, type NewReview } from "@/db/schemas";

export async function createReview(data: NewReview) {
  return db.transaction(async (tx) => {
    const result = await tx.insert(reviews).values(data);
    await recalculateMenuItemRating(tx, data.menuItemId);
    return result[0].insertId;
  });
}

export async function createAdminReview(data: {
  menuItemId: number;
  userName: string;
  userAvatar?: string | null;
  rating: number;
}) {
  return db.transaction(async (tx) => {
    const result = await tx.insert(reviews).values({
      menuItemId: data.menuItemId,
      userName: data.userName,
      userAvatar: data.userAvatar ?? null,
      rating: String(data.rating),
      userId: null,
    });
    await recalculateMenuItemRating(tx, data.menuItemId);
    return result[0].insertId;
  });
}

export async function getUserReviews(userId: number) {
  const rows = await db
    .select({
      menuItemId: reviews.menuItemId,
      rating: reviews.rating,
    })
    .from(reviews)
    .where(eq(reviews.userId, userId));

  return rows.map((r) => ({
    menuItemId: r.menuItemId,
    rating: Number(r.rating),
  }));
}

export async function getUserReviewForMenuItem(
  userId: number,
  menuItemId: number
) {
  const [row] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.menuItemId, menuItemId)))
    .limit(1);
  return row ?? null;
}

export async function recalculateMenuItemRatingAdmin(menuItemId: number) {
  return db.transaction(async (tx) => {
    await recalculateMenuItemRating(tx, menuItemId);
  });
}

async function recalculateMenuItemRating(
  tx: { select: typeof db.select; update: typeof db.update },
  menuItemId: number
) {
  const [agg] = await tx
    .select({
      avg: sql<string>`coalesce(avg(${reviews.rating}), 0)`,
      count: sql<string>`count(*)`,
    })
    .from(reviews)
    .where(eq(reviews.menuItemId, menuItemId));

  await tx
    .update(menuItems)
    .set({
      // rating: Number(Number(agg?.avg ?? 0).toFixed(2)).toString(),
      //to make always 3.5 rating regardless of the user review, if avgerage calulation is above 3.5 only then average shows else always 3.5
      rating: Number(Math.max(3.5, Number(agg?.avg ?? 0))).toFixed(2).toString(),
      reviews: Number(agg?.count ?? 0),
    })
    .where(eq(menuItems.id, menuItemId));
}

export async function getReviewsByMenuItem(menuItemId: number) {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      userId: reviews.userId,
      userName: sql<string>`COALESCE(${reviews.userName}, ${users.name})`.as("userName"),
      userAvatar: reviews.userAvatar,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.menuItemId, menuItemId))
    .orderBy(desc(reviews.createdAt));

  return rows;
}

export async function updateReview(
  reviewId: number,
  userId: number,
  data: { rating?: number; comment?: string }
) {
  const [existing] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
    .limit(1);

  if (!existing) {
    return null;
  }

  const updates: Record<string, unknown> = {};
  if (data.rating !== undefined) updates.rating = data.rating;
  if (data.comment !== undefined) updates.comment = data.comment;

  if (Object.keys(updates).length === 0) {
    return existing;
  }

  return db.transaction(async (tx) => {
    await tx.update(reviews).set(updates).where(eq(reviews.id, reviewId));
    await recalculateMenuItemRating(tx, existing.menuItemId);
    return { ...existing, ...updates };
  });
}

export async function deleteReview(reviewId: number, userId: number) {
  const [existing] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
    .limit(1);

  if (!existing) {
    return false;
  }

  return db.transaction(async (tx) => {
    await tx.delete(reviews).where(eq(reviews.id, reviewId));
    await recalculateMenuItemRating(tx, existing.menuItemId);
    return true;
  });
}
