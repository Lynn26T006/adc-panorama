import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

let cachedDb: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (cachedDb) return cachedDb;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const pool = mysql.createPool({ uri: url, connectionLimit: 10 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cachedDb = drizzle(pool as any, { schema, mode: "default" });
  return cachedDb;
}

export { schema };
