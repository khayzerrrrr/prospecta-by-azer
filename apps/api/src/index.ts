import { app } from "./app";
import { db, users, pipelineStages, territories, companies } from "@visitflow/db";
import { eq } from "drizzle-orm";
import { runMigrations } from "@visitflow/db/migrate";

await runMigrations();

// Auto-seed the default company on first boot (empty database)
let [defaultCompany] = await db.select().from(companies).where(eq(companies.slug, "default"));
if (!defaultCompany) {
  console.log("First run — seeding database...");

  [defaultCompany] = await db.insert(companies).values({
    name: "Default Company", slug: "default", subscriptionStatus: "active",
  }).returning();

  // Pipeline stages
  await db.insert(pipelineStages).values([
    { companyId: defaultCompany!.id, name: "Prospecting", order: 1, color: "#6366F1", emoji: "🔍", isDefault: true, probability: 20 },
    { companyId: defaultCompany!.id, name: "Kontak Awal", order: 2, color: "#3B82F6", emoji: "📞", isDefault: true, probability: 40 },
    { companyId: defaultCompany!.id, name: "Meeting", order: 3, color: "#F59E0B", emoji: "🤝", isDefault: true, probability: 60 },
    { companyId: defaultCompany!.id, name: "Proposal", order: 4, color: "#8B5CF6", emoji: "📋", isDefault: true, probability: 80 },
    { companyId: defaultCompany!.id, name: "Negosiasi", order: 5, color: "#EC4899", emoji: "💬", isDefault: true, probability: 90 },
    { companyId: defaultCompany!.id, name: "Closed Won", order: 6, color: "#10B981", emoji: "✅", isDefault: true, isWon: true, probability: 100 },
    { companyId: defaultCompany!.id, name: "Closed Lost", order: 7, color: "#EF4444", emoji: "❌", isDefault: true, isLost: true, probability: 0 },
  ]);

  // Territories
  await db.insert(territories).values([
    { companyId: defaultCompany!.id, name: "Jakarta Pusat", region: "DKI Jakarta", color: "#6366F1", centerLat: -6.2088, centerLng: 106.8456, zoomLevel: 12 },
    { companyId: defaultCompany!.id, name: "Bandung", region: "Jawa Barat", color: "#3B82F6", centerLat: -6.9175, centerLng: 107.6191, zoomLevel: 12 },
  ]);

  // Manager/agent scoping is territory-based — assign the demo accounts a
  // real territory so team data is actually visible out of the box.
  const [defaultTerritory] = await db.select({ id: territories.id }).from(territories).where(eq(territories.companyId, defaultCompany!.id)).limit(1);

  // Demo users (password: password123)
  const hashes = [
    await Bun.password.hash("password123", { algorithm: "argon2id" }),
    await Bun.password.hash("password123", { algorithm: "argon2id" }),
    await Bun.password.hash("password123", { algorithm: "argon2id" }),
  ];
  await db.insert(users).values([
    { companyId: defaultCompany!.id, email: "admin@visitflow.dev", passwordHash: hashes[0]!, fullName: "Admin VisitFlow", role: "admin" },
    { companyId: defaultCompany!.id, email: "manager@visitflow.dev", passwordHash: hashes[1]!, fullName: "Manager VisitFlow", role: "manager", territoryId: defaultTerritory?.id },
    { companyId: defaultCompany!.id, email: "agent@visitflow.dev", passwordHash: hashes[2]!, fullName: "Agent VisitFlow", role: "agent", territoryId: defaultTerritory?.id },
  ]);

  console.log("Seed complete — 1 company, 7 stages, 2 territories, 3 demo users");
  console.log("Login: admin@visitflow.dev / password123");
}

// Sentinel platform company — never used for tenant business data, exists
// only so master_account users (companyId isn't null in the DB, unlike the
// type's architectural intent) can authenticate through the existing
// tenant-scoped login lookup without any changes to auth.service.ts.
let [platformCompany] = await db.select().from(companies).where(eq(companies.slug, "_platform"));
if (!platformCompany) {
  [platformCompany] = await db.insert(companies).values({
    name: "Platform", slug: "_platform", subscriptionStatus: "active",
  }).returning();
}
const [existingMaster] = await db.select().from(users).where(eq(users.companyId, platformCompany!.id));
if (!existingMaster) {
  const hash = await Bun.password.hash("password123", { algorithm: "argon2id" });
  await db.insert(users).values({
    companyId: platformCompany!.id, email: "master@visitflow.dev", passwordHash: hash,
    fullName: "Platform Master", role: "master_account",
  });
  console.log("Platform master account seeded — master@visitflow.dev / password123");
}

const port = Number(process.env.PORT) || 3000;

app.listen({ port, hostname: "127.0.0.1" }, ({ hostname, port }) => {
  console.log(`VisitFlow API running at http://${hostname}:${port}`);
  console.log(`Swagger docs at http://${hostname}:${port}/docs`);
});
