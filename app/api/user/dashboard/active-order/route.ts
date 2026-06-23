import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserActiveOrder } from "@/db/services/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activeOrder = await getUserActiveOrder(user.id);
    return NextResponse.json({ order: activeOrder });
  } catch (error) {
    console.error("Failed to load active order", error);
    return NextResponse.json({ error: "Unable to load active order" }, { status: 500 });
  }
}
