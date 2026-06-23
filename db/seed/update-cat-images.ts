import "../../envConfig";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { categories } from "@/db/schemas";

const updates = [
  { slug: "asian", image: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=200" },
  { slug: "healthy", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200" },
];

async function main() {
  for (const u of updates) {
    await db.update(categories).set({ image: u.image }).where(eq(categories.slug, u.slug));
    console.log(`Updated ${u.slug}`);
  }
}

main().then(() => process.exit());
