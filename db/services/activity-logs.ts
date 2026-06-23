import { desc } from "drizzle-orm";

import { db } from "@/db";
import { activityLogs, type NewActivityLog } from "@/db/schemas";

export async function getActivityLogs(limit = 50) {
  return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

export async function createActivityLog(log: NewActivityLog) {
  const result = await db.insert(activityLogs).values(log);
  return result[0].insertId;
}
