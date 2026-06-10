import { and, asc, desc, eq, gte, like, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { categories, menuItems, type NewMenuItem } from "@/db/schemas";

export type MenuItemFilters = {
  category?: string;
  maxPrice?: number;
  minPrice?: number;
  query?: string;
  sort?: "name-asc" | "price-asc" | "price-desc" | "rating-desc";
};

export async function getMenuItems() {
  return db.select().from(menuItems).orderBy(asc(menuItems.title));
}

export async function getAvailableMenuItems() {
  return db
    .select()
    .from(menuItems)
    .where(eq(menuItems.isAvailable, true))
    .orderBy(asc(menuItems.title));
}

export async function getFilteredMenuItems(filters: MenuItemFilters = {}) {
  const conditions = [eq(menuItems.isAvailable, true)];

  if (filters.query) {
    conditions.push(like(menuItems.title, `%${filters.query}%`));
  }

  if (filters.category) {
    conditions.push(eq(categories.slug, filters.category));
  }

  if (typeof filters.minPrice === "number") {
    conditions.push(gte(menuItems.price, filters.minPrice.toFixed(2)));
  }

  if (typeof filters.maxPrice === "number") {
    conditions.push(lte(menuItems.price, filters.maxPrice.toFixed(2)));
  }

  const orderBy =
    filters.sort === "price-asc"
      ? asc(menuItems.price)
      : filters.sort === "price-desc"
        ? desc(menuItems.price)
        : filters.sort === "rating-desc"
          ? desc(menuItems.rating)
          : asc(menuItems.title);

  return db
    .select({
      id: menuItems.id,
      categoryId: menuItems.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      title: menuItems.title,
      slug: menuItems.slug,
      image: menuItems.image,
      description: menuItems.description,
      price: menuItems.price,
      badge: menuItems.badge,
      rating: menuItems.rating,
      reviews: menuItems.reviews,
      isAvailable: menuItems.isAvailable,
      createdAt: menuItems.createdAt,
      updatedAt: menuItems.updatedAt,
    })
    .from(menuItems)
    .leftJoin(categories, eq(menuItems.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(orderBy);
}

export async function getMenuPriceBounds() {
  const [bounds] = await db
    .select({
      min: sql<string>`coalesce(min(${menuItems.price}), 0)`,
      max: sql<string>`coalesce(max(${menuItems.price}), 0)`,
    })
    .from(menuItems)
    .where(eq(menuItems.isAvailable, true));

  return {
    min: Number(bounds?.min ?? 0),
    max: Number(bounds?.max ?? 0),
  };
}

export async function createMenuItem(menuItem: NewMenuItem) {
  const result = await db.insert(menuItems).values(menuItem);
  return result[0].insertId;
}

export async function updateMenuItem(id: number, menuItem: Partial<NewMenuItem>) {
  await db.update(menuItems).set(menuItem).where(eq(menuItems.id, id));
}

export async function deleteMenuItem(id: number) {
  await db.delete(menuItems).where(eq(menuItems.id, id));
}
