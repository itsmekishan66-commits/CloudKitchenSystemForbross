import { NextResponse } from "next/server";

// import { getCurrentUser } from "@/lib/auth";
// import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import {
  getCategories,
  getActiveCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/db/services/categories";
import type { NewCategory } from "@/db/schemas";
import { createActivityLog } from "@/db/services/activity-logs";
import apiRequirePermissions from "@/lib/apiRequirePermissions";

export const dynamic = "force-dynamic";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const categories = activeOnly ? await getActiveCategories() : await getCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to load categories", error);
    return NextResponse.json({ error: "Unable to load categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.CREATE_CATEGORIES
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const body = (await request.json()) as NewCategory;
    const name = cleanText(body.name);
    const slug = cleanText(body.slug);

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const categoryId = await createCategory({
      name,
      slug,
      image: cleanText(body.image) || null,
      isActive: body.isActive ?? true,
    });

    await createActivityLog({
      userId: user.id,
      action: `Created category: ${name}`,
      entityType: "category",
      entityId: categoryId,
    });

    return NextResponse.json({ categoryId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create category", error);
    return NextResponse.json({ error: "Unable to create category" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.UPDATE_CATEGORIES
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const body = (await request.json()) as NewCategory & { id: number };
    const id = Number(body.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    await updateCategory(id, {
      name: body.name,
      slug: body.slug,
      image: body.image,
      isActive: body.isActive,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update category", error);
    return NextResponse.json({ error: "Unable to update category" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.DELETE_CATEGORIES
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    await deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete category", error);
    return NextResponse.json({ error: "Unable to delete category" }, { status: 500 });
  }
}
