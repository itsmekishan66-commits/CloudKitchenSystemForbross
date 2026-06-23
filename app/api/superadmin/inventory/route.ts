import { NextResponse } from "next/server";

import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import {
  getInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from "@/db/services/inventory";
import type { NewInventoryItem } from "@/db/schemas";
import { createActivityLog } from "@/db/services/activity-logs";

export const dynamic = "force-dynamic";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.VIEW_INVENTORY
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const item = await getInventoryItemById(Number(id));
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ item });
    }

    const items = await getInventoryItems();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to load inventory", error);
    return NextResponse.json({ error: "Unable to load inventory" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.CREATE_INVENTORY
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const body = (await request.json()) as NewInventoryItem;
    const name = cleanText(body.name);

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const itemId = await createInventoryItem({
      ...body,
      name,
      category: cleanText(body.category) || "Other",
      unit: cleanText(body.unit) || "pcs",
    });

    await createActivityLog({
      userId: user.id,
      action: `Created inventory item: ${name}`,
      entityType: "inventory",
      entityId: itemId,
    });

    return NextResponse.json({ itemId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create inventory item", error);
    return NextResponse.json({ error: "Unable to create inventory item" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.UPDATE_INVENTORY
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const body = (await request.json()) as NewInventoryItem & { id: number };
    const id = Number(body.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    await updateInventoryItem(id, {
      name: body.name,
      category: body.category,
      quantity: body.quantity,
      unit: body.unit,
      minStockLevel: body.minStockLevel,
      pricePerUnit: body.pricePerUnit,
      kitchenId: body.kitchenId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update inventory item", error);
    return NextResponse.json({ error: "Unable to update inventory item" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.DELETE_INVENTORY
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

    await deleteInventoryItem(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete inventory item", error);
    return NextResponse.json({ error: "Unable to delete inventory item" }, { status: 500 });
  }
}
