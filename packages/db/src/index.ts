import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";
import { getDatabaseUrl } from "./env";

// prepare:false — Neon's pooled/serverless connection routing doesn't
// preserve prepared statements across the underlying physical connections,
// which otherwise causes phantom stale reads right after a write.
export const client = postgres(getDatabaseUrl(), { prepare: false });

export const db = drizzle(client, { schema });

export * from "./schema/index";
