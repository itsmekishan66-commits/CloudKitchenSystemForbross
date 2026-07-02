// this is the code for menu recipe - API route
import { NextResponse } from "next/server";

import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from "@/db/services/recipes";
import type { NewRecipe } from "@/db/schemas";
import { createActivityLog } from "@/db/services/activity-logs";

export const dynamic = "force-dynamic";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumberOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_RECIPES);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const menuItemId = searchParams.get("menuItemId");

    if (id) {
      const recipe = await getRecipeById(Number(id));
      if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ recipe });
    }

    const recipes = await getRecipes(menuItemId ? Number(menuItemId) : undefined);
    return NextResponse.json({ recipes });
  } catch (error) {
    console.error("Failed to load recipes", error);
    return NextResponse.json({ error: "Unable to load recipes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.CREATE_RECIPES);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const title = clean(body.title);
    const menuItemId = toNumberOrNull(body.menuItemId);

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!menuItemId) {
      return NextResponse.json({ error: "Menu item is required" }, { status: 400 });
    }

    const data: NewRecipe & { ingredients: Array<{ inventoryItemId: number; quantity: string; unit: string; notes?: string }> } = {
      menuItemId,
      title,
      description: clean(body.description) || null,
      instructions: clean(body.instructions) || null,
      prepTime: clean(body.prepTime) || null,
      cookTime: clean(body.cookTime) || null,
      servings: Number(body.servings) || 1,
      image: clean(body.image) || null,
      isActive: body.isActive !== false,
      ingredients: Array.isArray(body.ingredients) ? body.ingredients.map((ing: Record<string, unknown>) => ({
        inventoryItemId: Number(ing.inventoryItemId),
        quantity: String(ing.quantity ?? 0),
        unit: String(ing.unit ?? "pcs"),
        notes: ing.notes ? String(ing.notes) : undefined,
      })) : [],
    };

    const recipeId = await createRecipe(data);

    await createActivityLog({
      userId: user.id,
      action: `Created recipe: ${title}`,
      entityType: "recipe",
      entityId: recipeId,
    });

    return NextResponse.json({ recipeId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create recipe", error);
    return NextResponse.json({ error: "Unable to create recipe" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_RECIPES);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const id = Number(body.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) {
      const title = clean(body.title);
      if (!title) return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      updateData.title = title;
    }

    if (body.description !== undefined) updateData.description = clean(body.description) || null;
    if (body.instructions !== undefined) updateData.instructions = clean(body.instructions) || null;
    if (body.prepTime !== undefined) updateData.prepTime = clean(body.prepTime) || null;
    if (body.cookTime !== undefined) updateData.cookTime = clean(body.cookTime) || null;
    if (body.servings !== undefined) updateData.servings = Number(body.servings);
    if (body.image !== undefined) updateData.image = clean(body.image) || null;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.menuItemId !== undefined) updateData.menuItemId = Number(body.menuItemId);

    if (body.ingredients !== undefined) {
      updateData.ingredients = body.ingredients.map((ing: Record<string, unknown>) => ({
        id: ing.id ? Number(ing.id) : undefined,
        inventoryItemId: Number(ing.inventoryItemId),
        quantity: String(ing.quantity ?? 0),
        unit: String(ing.unit ?? "pcs"),
        notes: ing.notes ? String(ing.notes) : undefined,
      }));
    }

    await updateRecipe(id, updateData);

    await createActivityLog({
      userId: user.id,
      action: `Updated recipe #${id}`,
      entityType: "recipe",
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update recipe", error);
    return NextResponse.json({ error: "Unable to update recipe" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.DELETE_RECIPES);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    await deleteRecipe(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete recipe", error);
    return NextResponse.json({ error: "Unable to delete recipe" }, { status: 500 });
  }
}
