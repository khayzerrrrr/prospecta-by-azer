import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import * as schema from "./schema/index";
import { initSchema } from "./init";

const dbPath = process.env.DATABASE_URL || "data/visitflow.db";

// Ensure parent directory exists
try {
  const dir = dbPath.replace(/[/\\][^/\\]+$/, "");
  if (dir && dir !== dbPath) mkdirSync(dir, { recursive: true });
} catch {}

const sqlite = new Database(dbPath);
sqlite.exec("PRAGMA journal_mode=WAL");
sqlite.exec("PRAGMA foreign_keys=ON");

// Auto-create tables on first run
initSchema(sqlite);

export const db = drizzle(sqlite, { schema });

export * from "./schema/index";
export { initSchema } from "./init";
