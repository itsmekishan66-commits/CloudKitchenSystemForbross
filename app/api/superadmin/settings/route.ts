import { NextResponse } from "next/server";

import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { updateUser } from "@/db/services/users";
import { upsertSiteSettings, getSiteSettings } from "@/db/services/site-settings";
import type { NewSiteSettings } from "@/db/schemas/site-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_SETTINGS);
    if (user instanceof NextResponse) return user;

    const site = await getSiteSettings();

    return NextResponse.json({
      appName: site?.siteName ?? process.env.APP_NAME ?? "Cloud Kitchen",
      logo: site?.logo ?? null,
      superAdminEmail: user.email,
      superAdminName: user.name,
      superAdminPhone: user.phone,
      superAdminAddress: user.address,
      contactEmail: site?.contactEmail ?? "",
      contactPhone: site?.contactPhone ?? "",
      location: site?.location ?? "",
      aboutContent: site?.aboutContent ?? null,
      contactContent: site?.contactContent ?? null,
    });
  } catch (error) {
    console.error("Failed to load settings", error);
    return NextResponse.json({ error: "Unable to load settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_SETTINGS);
    if (user instanceof NextResponse) return user;

    const formData = await request.formData();

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const name = formData.get("name") as string | null;
    const email = formData.get("email") as string | null;
    const phone = formData.get("phone") as string | null;
    const address = formData.get("address") as string | null;

    if (email !== null && email !== "" && !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (name || email || phone || address) {
      await updateUser(user.id, {
        name: name ?? user.name,
        email: email ?? user.email,
        phone: phone ?? user.phone,
        address: address ?? user.address,
      });
    }

    const siteName = formData.get("restaurantName") as string | null;
    const contactEmail = formData.get("contactEmail") as string | null;
    const contactPhone = formData.get("contactPhone") as string | null;
    const location = formData.get("location") as string | null;
    const aboutContentRaw = formData.get("aboutContent") as string | null;
    const contactContentRaw = formData.get("contactContent") as string | null;

    const logoFile = formData.get("logo") as File | null;
    let logo: string | null = null;

    if (logoFile && logoFile.size > 0) {
      const MAX_LOGO_BYTES = 1 * 1024 * 1024; // 1MB
      if (logoFile.size > MAX_LOGO_BYTES) {
        return NextResponse.json({ error: "Logo must be under 1MB" }, { status: 400 });
      }
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const ext = (logoFile.name.split(".").pop() || "png").toLowerCase();
      const logoFileName = `logo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const logoRelPath = `uploads/${logoFileName}`;
      const { writeFileSync, mkdirSync } = await import("fs");
      const { join } = await import("path");
      mkdirSync(join(process.cwd(), "public", "uploads"), { recursive: true });
      writeFileSync(join(process.cwd(), "public", logoRelPath), buffer);
      logo = `/${logoRelPath}`;
    }

    const updateData: Partial<NewSiteSettings> = {};
    if (siteName) updateData.siteName = siteName;
    if (contactEmail !== null) {
      if (contactEmail !== "" && !EMAIL_RE.test(contactEmail)) {
        return NextResponse.json({ error: "Invalid contact email address" }, { status: 400 });
      }
      updateData.contactEmail = contactEmail || null;
    }
    if (contactPhone !== null) updateData.contactPhone = contactPhone || null;
    if (location !== null) updateData.location = location || null;
    if (logo) updateData.logo = logo;
    if (aboutContentRaw) updateData.aboutContent = aboutContentRaw as unknown as NewSiteSettings["aboutContent"];
    if (contactContentRaw) updateData.contactContent = contactContentRaw as unknown as NewSiteSettings["contactContent"];

    if (Object.keys(updateData).length > 0) {
      await upsertSiteSettings(updateData);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update settings", error);
    return NextResponse.json({ error: "Unable to update settings" }, { status: 500 });
  }
}
