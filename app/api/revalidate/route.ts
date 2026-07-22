import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/cache-tags";

export const dynamic = "force-dynamic";

const VALID_TAGS: string[] = Object.values(CACHE_TAGS);

export async function POST(req: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_SETTINGS);
    if (user instanceof NextResponse) return user;

    const { tag } = await req.json();

    if (!tag || typeof tag !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'tag' field" }, { status: 400 });
    }

    if (!VALID_TAGS.includes(tag)) {
      return NextResponse.json(
        { error: `Invalid tag. Valid tags: ${VALID_TAGS.join(", ")}` },
        { status: 400 }
      );
    }

    revalidateTag(tag, "max");
    return NextResponse.json({ revalidated: tag, now: Date.now() });
  } catch (error) {
    console.error("Revalidation failed:", error);
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}
