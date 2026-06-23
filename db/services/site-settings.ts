import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings, type NewSiteSettings } from "@/db/schemas/site-settings";

function parseRow(row: typeof siteSettings.$inferSelect | undefined): typeof siteSettings.$inferSelect | null {
  if (!row) return null;
  return {
    ...row,
    aboutContent: typeof row.aboutContent === "string" ? tryParseJson(row.aboutContent) : row.aboutContent,
    contactContent: typeof row.contactContent === "string" ? tryParseJson(row.contactContent) : row.contactContent,
  };
}

function tryParseJson(val: unknown): unknown {
  if (typeof val !== "string") return val;
  try { return JSON.parse(val); } catch { return val; }
}

export async function getSiteSettings() {
  const [settings] = await db
    .select()
    .from(siteSettings)
    .limit(1);
  return parseRow(settings);
}

function serializeForDb(data: Partial<NewSiteSettings>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "aboutContent" || key === "contactContent") {
      if (typeof value === "string") {
        result[key] = value;
      } else if (value !== null && value !== undefined) {
        result[key] = JSON.stringify(value);
      } else {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function upsertSiteSettings(
  data: Partial<NewSiteSettings>,
) {
  const existing = await getSiteSettings();
  const dbData = serializeForDb(data) as Partial<NewSiteSettings>;

  if (existing) {
    await db.update(siteSettings).set(dbData).where(eq(siteSettings.id, existing.id));
  } else {
    await db.insert(siteSettings).values(dbData as NewSiteSettings);
  }

  return getSiteSettings();
}
