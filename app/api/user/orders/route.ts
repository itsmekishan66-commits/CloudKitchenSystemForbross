import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserOrdersWithItems } from "@/db/services/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await getUserOrdersWithItems(user.id);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Failed to load orders", error);
    return NextResponse.json({ error: "Unable to load orders" }, { status: 500 });
  }
}
