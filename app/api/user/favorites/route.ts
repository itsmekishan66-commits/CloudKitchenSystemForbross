import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserFavoriteItems } from "@/db/services/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const favorites = await getUserFavoriteItems(user.id);
    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("Failed to load favorites", error);
    return NextResponse.json({ error: "Unable to load favorites" }, { status: 500 });
  }
}
