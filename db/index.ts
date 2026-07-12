import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import * as schema from "./schemas";

const globalForDb = globalThis as typeof globalThis & {
  mysqlPool?: mysql.Pool;
  drizzleDb?: DrizzleDatabase;
};

function createDrizzle() {
  return drizzle(getPool(), { schema, mode: "default" });
}

type DrizzleDatabase = ReturnType<typeof createDrizzle>;

function getPool() {
  if (globalForDb.mysqlPool) {
    return globalForDb.mysqlPool;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = mysql.createPool({
    uri: databaseUrl,
    waitForConnections: true,
    connectionLimit: 50,
    queueLimit: 0,
  });

  globalForDb.mysqlPool = pool;

  return pool;
}

export function getDb() {
  if (!globalForDb.drizzleDb) {
    globalForDb.drizzleDb = createDrizzle();
  }
  return globalForDb.drizzleDb;
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export { getPool };
