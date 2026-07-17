import { app } from "./app";
import { db, users, pipelineStages, territories } from "@visitflow/db";
import { sql } from "drizzle-orm";

// Auto-seed on first run (empty database)
const userCount = db.select({ count: sql<number>`count(*)` }).from(users).all();
if (!userCount[0] || userCount[0].count === 0) {
  console.log("First run — seeding database...");

  // Pipeline stages
  db.insert(pipelineStages).values([
    { name: "Prospecting", order: 1, color: "#6366F1", emoji: "🔍", isDefault: true, probability: 20 },
    { name: "Kontak Awal", order: 2, color: "#3B82F6", emoji: "📞", isDefault: true, probability: 40 },
    { name: "Meeting", order: 3, color: "#F59E0B", emoji: "🤝", isDefault: true, probability: 60 },
    { name: "Proposal", order: 4, color: "#8B5CF6", emoji: "📋", isDefault: true, probability: 80 },
    { name: "Negosiasi", order: 5, color: "#EC4899", emoji: "💬", isDefault: true, probability: 90 },
    { name: "Closed Won", order: 6, color: "#10B981", emoji: "✅", isDefault: true, isWon: true, probability: 100 },
    { name: "Closed Lost", order: 7, color: "#EF4444", emoji: "❌", isDefault: true, isLost: true, probability: 0 },
  ]).run();

  // Territories
  db.insert(territories).values([
    { name: "Jakarta Pusat", region: "DKI Jakarta", color: "#6366F1", centerLat: -6.2088, centerLng: 106.8456, zoomLevel: 12 },
    { name: "Bandung", region: "Jawa Barat", color: "#3B82F6", centerLat: -6.9175, centerLng: 107.6191, zoomLevel: 12 },
  ]).run();

  // Manager/agent scoping is territory-based — assign the demo accounts a
  // real territory so team data is actually visible out of the box.
  const [defaultTerritory] = db.select({ id: territories.id }).from(territories).limit(1).all();

  // Demo users (password: password123)
  const hashes = [
    await Bun.password.hash("password123", { algorithm: "argon2id" }),
    await Bun.password.hash("password123", { algorithm: "argon2id" }),
    await Bun.password.hash("password123", { algorithm: "argon2id" }),
  ];
  db.insert(users).values([
    { email: "admin@visitflow.dev", passwordHash: hashes[0], fullName: "Admin VisitFlow", role: "admin" },
    { email: "manager@visitflow.dev", passwordHash: hashes[1], fullName: "Manager VisitFlow", role: "manager", territoryId: defaultTerritory?.id },
    { email: "agent@visitflow.dev", passwordHash: hashes[2], fullName: "Agent VisitFlow", role: "agent", territoryId: defaultTerritory?.id },
  ]).run();

  console.log("Seed complete — 7 stages, 2 territories, 3 demo users");
  console.log("Login: admin@visitflow.dev / password123");
}

const port = Number(process.env.PORT) || 3000;

app.listen({ port, hostname: "0.0.0.0" }, ({ hostname, port }) => {
  console.log(`VisitFlow API running at http://${hostname}:${port}`);
  console.log(`Swagger docs at http://${hostname}:${port}/docs`);
});
