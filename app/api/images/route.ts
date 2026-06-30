import { NextResponse } from "next/server";
import { readdirSync, statSync, writeFileSync, mkdirSync } from "fs";
import { join, extname } from "path";
import { randomUUID } from "crypto";

const IMAGE_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg",
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = join("uploads", "menu");

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

export async function GET() {
  const publicDir = join(process.cwd(), "public");
  const images = walk(publicDir, "");
  images.sort();
  return NextResponse.json({ images });
}

export async function POST(request: Request) {
  try {
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
      return NextResponse.json({ error: "Invalid file type. Allowed: jpg, jpeg, png, gif, webp, avif, svg" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${randomUUID()}${ext}`;
    const relativePath = `${UPLOAD_DIR}/${filename}`;
    const absoluteDir = join(process.cwd(), "public", UPLOAD_DIR);
    const absolutePath = join(process.cwd(), "public", relativePath);

    mkdirSync(absoluteDir, { recursive: true });
    writeFileSync(absolutePath, buffer);

    return NextResponse.json({ path: "/" + relativePath.replace(/\\/g, "/") });
  } catch (error) {
    console.error("Upload failed", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
