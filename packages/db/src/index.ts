import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";
import { getDatabaseUrl } from "./env";

export const client = postgres(getDatabaseUrl());

export const db = drizzle(client, { schema });

export * from "./schema/index";
