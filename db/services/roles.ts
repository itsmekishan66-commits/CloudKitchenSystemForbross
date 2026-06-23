import { asc } from "drizzle-orm";

import { db } from "@/db";
import { roles } from "@/db/schemas";

export async function getRoles() {
  return db
    .select()
    .from(roles)
    .orderBy(asc(roles.name));
}

export async function createRole(name: string, description?: string) {
  const result = await db.insert(roles).values({ name, description });
  return result[0].insertId;
}