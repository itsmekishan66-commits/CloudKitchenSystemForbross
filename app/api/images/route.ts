import { NextResponse } from "next/server";
import { readdirSync, statSync, writeFileSync, mkdirSync } from "fs";
import { join, extname } from "path";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";

const IMAGE_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif",
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = join("uploads", "menu");
const IMAGE_CACHE_TTL = 30 * 1000; // 30s

let cachedImages: string[] | null = null;
let cachedAt = 0;

function walk(dir: string, baseDir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        const nextBase = join(baseDir, entry).replace(/\\/g, "/");
        results.push(...walk(full, nextBase));
      } else {
        const ext = entry.slice(entry.lastIndexOf(".")).toLowerCase();
        if (IMAGE_EXTENSIONS.has(ext)) {
          const path = baseDir ? baseDir + "/" + entry : entry;
          results.push("/" + path.replace(/\\/g, "/"));
        }
      }
    }
  } catch {}
  return results;
}

function getPublicImages(): string[] {
  const now = Date.now();
  if (cachedImages && now - cachedAt < IMAGE_CACHE_TTL) {
    return cachedImages;
  }
  const publicDir = join(process.cwd(), "public");
  const images = walk(publicDir, "");
  images.sort();
  cachedImages = images;
  cachedAt = now;
  return images;
}

export async function GET() {
  return NextResponse.json({ images: getPublicImages() });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.isGuest || user.role === "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const ext = extname(file.name).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: jpg, jpeg, png, gif, webp, avif" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${randomUUID()}${ext}`;
    const relativePath = `${UPLOAD_DIR}/${filename}`;
    const absoluteDir = join(process.cwd(), "public", UPLOAD_DIR);
    const absolutePath = join(process.cwd(), "public", relativePath);

    mkdirSync(absoluteDir, { recursive: true });
    writeFileSync(absolutePath, buffer);

    cachedImages = null;

    return NextResponse.json({ path: "/" + relativePath.replace(/\\/g, "/") });
  } catch (error) {
    console.error("Upload failed", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
