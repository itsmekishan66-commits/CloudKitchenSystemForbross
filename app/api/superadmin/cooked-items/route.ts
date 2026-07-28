import { NextResponse } from "next/server";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import {
  getCookedFoodStock,
  getCookedFoodStockById,
  createCookedFoodStock,
  updateCookedFoodStock,
  deleteCookedFoodStock,
  cookRecipe,
} from "@/db/services/cooked-food-stock";
import type { NewCookedFoodStock } from "@/db/schemas";
import { createActivityLog } from "@/db/services/activity-logs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_INVENTORY);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const item = await getCookedFoodStockById(Number(id));
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ item });
    }

    const items = await getCookedFoodStock();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to load cooked food stock", error);
    return NextResponse.json({ error: "Unable to load cooked food stock" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.CREATE_INVENTORY);
    if (user instanceof NextResponse) return user;

    const body = (await request.json()) as NewCookedFoodStock & { recipeId?: number; batchCount?: number };

    if (body.quantity === undefined || body.quantity === null || body.quantity === "") {
      return NextResponse.json({ error: "Quantity is required" }, { status: 400 });
    }

    if (body.recipeId) {
      const batchCount = Number(body.batchCount) || 1;
      const cookResult = await cookRecipe(Number(body.recipeId), batchCount);

      await createActivityLog({
        userId: user.id,
        action: `Cooked recipe #${body.recipeId} (batch=${batchCount}), produced ${cookResult.quantityProduced} of menu item #${cookResult.menuItemId}`,
        entityType: "inventory",
        entityId: cookResult.menuItemId,
      });

      return NextResponse.json({ menuItemId: cookResult.menuItemId, quantityProduced: cookResult.quantityProduced }, { status: 201 });
    }

    if (!body.menuItemId) {
      return NextResponse.json({ error: "Food name is required" }, { status: 400 });
    }

    const itemId = await createCookedFoodStock({
      menuItemId: Number(body.menuItemId),
      quantity: String(body.quantity),
      minStockLevel: body.minStockLevel ? String(body.minStockLevel) : "0",
      description: body.description || null,
    });

    await createActivityLog({
      userId: user.id,
      action: `Added cooked food stock item #${itemId}`,
      entityType: "inventory",
      entityId: itemId,
    });

    return NextResponse.json({ itemId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create cooked food stock", error);
    const message = error instanceof Error ? error.message : "Unable to create cooked food stock";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_INVENTORY);
    if (user instanceof NextResponse) return user;

    const body = (await request.json()) as NewCookedFoodStock & { id: number };
    const id = Number(body.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    const existing = await getCookedFoodStockById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await updateCookedFoodStock(id, {
      menuItemId: body.menuItemId ? Number(body.menuItemId) : existing.menuItemId,
      quantity: body.quantity !== undefined ? String(body.quantity) : existing.quantity,
      minStockLevel: body.minStockLevel !== undefined ? String(body.minStockLevel) : existing.minStockLevel,
      description: body.description !== undefined ? body.description : existing.description,
    });

    await createActivityLog({
      userId: user.id,
      action: `Updated cooked food stock item #${id}`,
      entityType: "inventory",
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update cooked food stock", error);
    return NextResponse.json({ error: "Unable to update cooked food stock" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.DELETE_INVENTORY);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    await deleteCookedFoodStock(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete cooked food stock", error);
    return NextResponse.json({ error: "Unable to delete cooked food stock" }, { status: 500 });
  }
}
