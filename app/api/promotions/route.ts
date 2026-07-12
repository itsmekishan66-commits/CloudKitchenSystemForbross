import { NextResponse } from "next/server";

import { getActivePromotionByCode, getActivePromotions } from "@/db/services/promotions";
import { cacheHeaders } from "@/lib/apiCache";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code")?.trim();

    if (code) {
      const promotion = await getActivePromotionByCode(code);
      if (!promotion) {
        return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });
      }

      const now = new Date();
      const startsAt = promotion.startsAt ? new Date(promotion.startsAt) : null;
      const endsAt = promotion.endsAt ? new Date(promotion.endsAt) : null;
      const usageLimit = Number(promotion.usageLimit ?? 0) || 0;
      const usageCount = Number(promotion.usageCount ?? 0) || 0;
      const isValid = (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now) && (usageLimit === 0 || usageCount < usageLimit);

      if (!isValid) {
        return NextResponse.json({ error: "Coupon is no longer valid" }, { status: 404 });
      }

      return NextResponse.json({ promotion }, { headers: cacheHeaders(120) });
    }

    const promotions = await getActivePromotions();
    return NextResponse.json({ promotions }, { headers: cacheHeaders(120) });
  } catch (error) {
    console.error("Failed to load public promotions", error);
    return NextResponse.json({ error: "Unable to load promotions" }, { status: 500 });
  }
}
