import { NextResponse } from "next/server";

import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import {
  getKitchens,
  getKitchenById,
  createKitchen,
  updateKitchen,
  deleteKitchen,
} from "@/db/services/kitchens";
import type { NewKitchen } from "@/db/schemas";
import { createActivityLog } from "@/db/services/activity-logs";

export const dynamic = "force-dynamic";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.VIEW_KITCHENS
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const kitchen = await getKitchenById(Number(id));
      if (!kitchen) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ kitchen });
    }

    const kitchens = await getKitchens();
    return NextResponse.json({ kitchens });
  } catch (error) {
    console.error("Failed to load kitchens", error);
    return NextResponse.json({ error: "Unable to load kitchens" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.CREATE_KITCHENS
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const body = (await request.json()) as NewKitchen;
    const name = cleanText(body.name);
    const slug = cleanText(body.slug);

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const kitchenId = await createKitchen({
      ...body,
      name,
      slug,
      location: cleanText(body.location) || null,
      phone: cleanText(body.phone) || null,
      email: cleanText(body.email) || null,
      managerName: cleanText(body.managerName) || null,
    });

    await createActivityLog({
      userId: user.id,
      action: `Created kitchen: ${name}`,
      entityType: "kitchen",
      entityId: kitchenId,
      details: { name, slug },
    });

    return NextResponse.json({ kitchenId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create kitchen", error);
    return NextResponse.json({ error: "Unable to create kitchen" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.UPDATE_KITCHENS
    );

    // apiRequirePermissions returns a response if denied
    if (user instanceof NextResponse) {
      return user;
    }

    const body = (await request.json()) as NewKitchen & { id: number };
    const id = Number(body.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    await updateKitchen(id, {
      name: body.name,
      slug: body.slug,
      location: body.location,
      phone: body.phone,
      email: body.email,
      managerName: body.managerName,
      isActive: body.isActive,
    });

    await createActivityLog({
      userId: user.id,
      action: `Updated kitchen: ${body.name}`,
      entityType: "kitchen",
      entityId: id,
      details: body,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update kitchen", error);
    return NextResponse.json({ error: "Unable to update kitchen" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // RBAC check
    const user = await apiRequirePermissions(
      PERMISSIONS.DELETE_KITCHENS
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

    await deleteKitchen(id);

    await createActivityLog({
      userId: user.id,
      action: `Deleted kitchen id: ${id}`,
      entityType: "kitchen",
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete kitchen", error);
    return NextResponse.json({ error: "Unable to delete kitchen" }, { status: 500 });
  }
}
