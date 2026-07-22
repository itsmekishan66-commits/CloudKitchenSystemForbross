import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/cache-tags";
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
      homeVideoBurger: site?.homeVideoBurger ?? null,
      home3dSliderVideos: site?.home3dSliderVideos ?? null,
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

    const ct = request.headers.get("content-type") || "";
    const isJson = ct.includes("application/json");

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const updateData: Partial<NewSiteSettings> = {};

    if (isJson) {
      const body = await request.json();

      if (body.aboutContent) {
        updateData.aboutContent = body.aboutContent as NewSiteSettings["aboutContent"];
      }
      if (body.contactContent) {
        updateData.contactContent = body.contactContent as NewSiteSettings["contactContent"];
      }

      if (Object.keys(updateData).length > 0) {
        await upsertSiteSettings(updateData);
        revalidateTag(CACHE_TAGS.SITE_SETTINGS, "max");
      }

      return NextResponse.json({ ok: true });
    }

    const formData = await request.formData();

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
      const MAX_LOGO_BYTES = 1 * 1024 * 1024;
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

    const homeVideoBurgerRaw = formData.get("homeVideoBurger") as string | null;
    const home3dSliderVideosRaw = formData.get("home3dSliderVideos") as string | null;

    if (homeVideoBurgerRaw) {
      const parsed = JSON.parse(homeVideoBurgerRaw);
      const file = formData.get("homeVideoBurgerFile") as File | null;
      if (file && file.size > 0) {
        const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
        if (file.size > MAX_VIDEO_BYTES) {
          return NextResponse.json({ error: "Featured video must be under 50MB" }, { status: 400 });
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
        const videoFileName = `featured-video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const videoRelPath = `uploads/${videoFileName}`;
        const { writeFileSync, mkdirSync } = await import("fs");
        const { join } = await import("path");
        mkdirSync(join(process.cwd(), "public", "uploads"), { recursive: true });
        writeFileSync(join(process.cwd(), "public", videoRelPath), buffer);
        parsed.url = `/${videoRelPath}`;
      }
      updateData.homeVideoBurger = parsed;
    }
    if (home3dSliderVideosRaw) {
      const parsed = JSON.parse(home3dSliderVideosRaw);
      if (Array.isArray(parsed)) {
        for (let i = 0; i < parsed.length; i++) {
          const file = formData.get(`sliderVideoFile_${i}`) as File | null;
          if (file && file.size > 0) {
            const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
            if (file.size > MAX_VIDEO_BYTES) {
              return NextResponse.json({ error: `Video ${i + 1} must be under 50MB` }, { status: 400 });
            }
            const buffer = Buffer.from(await file.arrayBuffer());
            const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
            const videoFileName = `slider-video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const videoRelPath = `uploads/${videoFileName}`;
            const { writeFileSync, mkdirSync } = await import("fs");
            const { join } = await import("path");
            mkdirSync(join(process.cwd(), "public", "uploads"), { recursive: true });
            writeFileSync(join(process.cwd(), "public", videoRelPath), buffer);
            parsed[i].url = `/${videoRelPath}`;
          }
        }
        updateData.home3dSliderVideos = parsed as NewSiteSettings["home3dSliderVideos"];
      }
    }

    if (Object.keys(updateData).length > 0) {
      await upsertSiteSettings(updateData);
      revalidateTag(CACHE_TAGS.SITE_SETTINGS, "max");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update settings", error);
    return NextResponse.json({ error: "Unable to update settings" }, { status: 500 });
  }
}
