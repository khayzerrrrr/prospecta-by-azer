import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "node:path";
import { db, client } from "./index";

// Resolve relative to this file, not the caller's cwd — apps/api runs with
// cwd=apps/api, where a relative "./drizzle" would never exist.
const migrationsFolder = path.join(import.meta.dir, "../drizzle");

export async function runMigrations() {
  await migrate(db, { migrationsFolder });
}

if (import.meta.main) {
  runMigrations()
    .then(() => console.log("Migrations applied"))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exitCode = 1;
    })
    .finally(() => client.end());
}
