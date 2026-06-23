import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/lib/permissions";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "@/db/services/menu-items";
import type { NewMenuItem } from "@/db/schemas";
import { createActivityLog } from "@/db/services/activity-logs";

export const dynamic = "force-dynamic";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  try {
    const items = await getMenuItems();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to load menu items", error);
    return NextResponse.json({ error: "Unable to load menu items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.CREATE_MENUS
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const body = (await request.json()) as NewMenuItem;
    const title = cleanText(body.title);
    const slug = cleanText(body.slug);

    if (!title || !slug) {
      return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
    }

    const menuItemId = await createMenuItem({
      ...body,
      title,
      slug,
      description: cleanText(body.description) || null,
      image: cleanText(body.image) || null,
      badge: cleanText(body.badge) || null,
    });

    await createActivityLog({
      userId: user.id,
      action: `Created menu item: ${title}`,
      entityType: "menu_item",
      entityId: menuItemId,
    });

    return NextResponse.json({ menuItemId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create menu item", error);
    return NextResponse.json({ error: "Unable to create menu item" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.UPDATE_MENUS
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const body = (await request.json()) as NewMenuItem & { id: number };
    const id = Number(body.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    await updateMenuItem(id, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update menu item", error);
    return NextResponse.json({ error: "Unable to update menu item" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.DELETE_MENUS
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

    await deleteMenuItem(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete menu item", error);
    return NextResponse.json({ error: "Unable to delete menu item" }, { status: 500 });
  }
}
