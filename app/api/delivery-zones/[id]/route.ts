import { NextResponse } from "next/server";
import { updateZone, toggleZoneStatus, deleteZone, getZoneById, } from "@/db/services/delivery-zones";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await apiRequirePermissions(PERMISSIONS.UPDATE_SETTINGS);
        if (user instanceof NextResponse) return user;

        const { id: idStr } = await params;
        const id = Number(idStr);
        if (!Number.isInteger(id)) {
            return NextResponse.json({ error: "Invalid zone ID" }, { status: 400 });
        }

        const body = await request.json();
        const { action, landmarkName, deliveryCharge, minOrderAmount, isActive } = body;

        if (action === "toggle") {
            const newStatus = await toggleZoneStatus(id);
            if (newStatus === null) {
                return NextResponse.json(
                    { error: "Zone not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json({ isActive: newStatus });
        }

        const updateData: Record<string, unknown> = {};
        if (landmarkName?.trim()) updateData.landmarkName = landmarkName.trim();
        if (deliveryCharge !== undefined) {
            const charge = Number(deliveryCharge);
            if (!Number.isFinite(charge) || charge < 0) {
                return NextResponse.json(
                    { error: "Delivery charge must be a valid non-negative number" },
                    { status: 400 }
                );
            }
            updateData.deliveryCharge = charge.toFixed(2);
        }
        if (minOrderAmount !== undefined) {
            updateData.minOrderAmount = minOrderAmount
                ? Number(minOrderAmount).toFixed(2)
                : null;
        }
        if (isActive !== undefined) updateData.isActive = Boolean(isActive);

        await updateZone(id, updateData);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Failed to update delivery zone", error);
        return NextResponse.json(
            { error: "Unable to update delivery zone" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await apiRequirePermissions(PERMISSIONS.UPDATE_SETTINGS);
        if (user instanceof NextResponse) return user;

        const { id: idStr } = await params;
        const id = Number(idStr);
        if (!Number.isInteger(id)) {
            return NextResponse.json({ error: "Invalid zone ID" }, { status: 400 });
        }

        await deleteZone(id);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Failed to delete delivery zone", error);
        return NextResponse.json(
            { error: "Unable to delete delivery zone" },
            { status: 500 }
        );
    }
}