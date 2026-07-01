import { NextResponse } from "next/server";
import { getActiveZones, getAllZones, createZone } from "@/db/services/delivery-zones";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get("admin");

    // Public endpoint - return active zones
    if (!admin) {
        try {
            const zones = await getActiveZones();
            return NextResponse.json({ zones });
        } catch (error) {
            console.error("Failed to load delivery zones", error);
            return NextResponse.json(
                { error: "Unable to load delivery zones" },
                { status: 500 }
            );
        }
    }

    // Admin endpoint - return all zones
    try {
        const user = await apiRequirePermissions(PERMISSIONS.UPDATE_SETTINGS);
        if (user instanceof NextResponse) return user;

        const zones = await getAllZones();
        return NextResponse.json({ zones });
    } catch (error) {
        console.error("Failed to load delivery zones", error);
        return NextResponse.json(
            { error: "Unable to load delivery zones" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const user = await apiRequirePermissions(PERMISSIONS.UPDATE_SETTINGS);
        if (user instanceof NextResponse) return user;

        const body = await request.json();
        const { landmarkName, deliveryCharge, minOrderAmount } = body;

        if (!landmarkName?.trim() || deliveryCharge === undefined) {
            return NextResponse.json(
                { error: "Landmark name and delivery charge are required" },
                { status: 400 }
            );
        }

        const charge = Number(deliveryCharge);
        if (!Number.isFinite(charge) || charge < 0) {
            return NextResponse.json(
                { error: "Delivery charge must be a valid non-negative number" },
                { status: 400 }
            );
        }

        const zoneId = await createZone({
            landmarkName: landmarkName.trim(),
            deliveryCharge: charge.toFixed(2),
            minOrderAmount: minOrderAmount ? Number(minOrderAmount).toFixed(2) : null,
        });

        return NextResponse.json({ zoneId }, { status: 201 });
    } catch (error) {
        console.error("Failed to create delivery zone", error);
        return NextResponse.json(
            { error: "Unable to create delivery zone" },
            { status: 500 }
        );
    }
}