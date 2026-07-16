import { app } from "./app";
import { db, users } from "@visitflow/db";

// Auto-seed on first run (empty database)
const userCount = db.select().from(users).all();
if (userCount.length === 0) {
  try {
    const { seed } = await import("@visitflow/db/seed");
    await seed();
    console.log("Database seeded successfully");
  } catch (e) {
    console.warn("Seed skipped (may already have data):", e);
  }
}

const port = Number(process.env.PORT) || 3000;

app.listen({ port }, ({ hostname, port }) => {
  console.log(`VisitFlow API running at http://${hostname}:${port}`);
  console.log(`Swagger docs at http://${hostname}:${port}/docs`);
});
