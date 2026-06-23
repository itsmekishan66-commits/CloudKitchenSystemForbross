import { NextResponse } from "next/server";

import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import {
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "@/db/services/promotions";
import type { NewPromotion } from "@/db/schemas";
import { createActivityLog } from "@/db/services/activity-logs";

export const dynamic = "force-dynamic";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumberOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toDateOrNull(value: unknown): Date | null {
  if (!value || typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_PROMOTIONS);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const promotion = await getPromotionById(Number(id));
      if (!promotion) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ promotion });
    }

    const promotions = await getPromotions();
    return NextResponse.json({ promotions });
  } catch (error) {
    console.error("Failed to load promotions", error);
    return NextResponse.json({ error: "Unable to load promotions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.CREATE_PROMOTIONS);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const title = clean(body.title);
    const discountValue = toNumberOrNull(body.discountValue);
    const usageLimit = toNumberOrNull(body.usageLimit);
    const startsAt = toDateOrNull(body.startsAt);
    const endsAt = toDateOrNull(body.endsAt);

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!discountValue || discountValue <= 0) {
      return NextResponse.json({ error: "Discount value must be a positive number" }, { status: 400 });
    }

    if (body.discountType && !["percentage", "fixed"].includes(body.discountType)) {
      return NextResponse.json({ error: "Discount type must be 'percentage' or 'fixed'" }, { status: 400 });
    }

    if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
    }

    const data: NewPromotion = {
      title,
      description: clean(body.description) || null,
      discountType: body.discountType || "percentage",
      discountValue: discountValue.toString(),
      code: clean(body.code) || null,
      isActive: body.isActive ?? true,
      startsAt,
      endsAt,
      usageLimit,
    };

    const promotionId = await createPromotion(data);

    await createActivityLog({
      userId: user.id,
      action: `Created promotion: ${title}`,
      entityType: "promotion",
      entityId: promotionId,
    });

    return NextResponse.json({ promotionId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create promotion", error);
    return NextResponse.json({ error: "Unable to create promotion" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_PROMOTIONS);
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

    if (body.description !== undefined) {
      updateData.description = clean(body.description) || null;
    }

    if (body.discountType !== undefined) {
      if (!["percentage", "fixed"].includes(body.discountType)) {
        return NextResponse.json({ error: "Discount type must be 'percentage' or 'fixed'" }, { status: 400 });
      }
      updateData.discountType = body.discountType;
    }

    if (body.discountValue !== undefined) {
      const dv = toNumberOrNull(body.discountValue);
      if (!dv || dv <= 0) {
        return NextResponse.json({ error: "Discount value must be a positive number" }, { status: 400 });
      }
      updateData.discountValue = dv.toString();
    }

    if (body.code !== undefined) {
      updateData.code = clean(body.code) || null;
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
      }
      updateData.isActive = body.isActive;
    }

    if (body.startsAt !== undefined) {
      updateData.startsAt = toDateOrNull(body.startsAt);
    }

    if (body.endsAt !== undefined) {
      updateData.endsAt = toDateOrNull(body.endsAt);
    }

    if (body.usageLimit !== undefined) {
      updateData.usageLimit = toNumberOrNull(body.usageLimit);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await updatePromotion(id, updateData);

    await createActivityLog({
      userId: user.id,
      action: `Updated promotion #${id}`,
      entityType: "promotion",
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update promotion", error);
    return NextResponse.json({ error: "Unable to update promotion" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.DELETE_PROMOTIONS);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    await deletePromotion(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete promotion", error);
    return NextResponse.json({ error: "Unable to delete promotion" }, { status: 500 });
  }
}
