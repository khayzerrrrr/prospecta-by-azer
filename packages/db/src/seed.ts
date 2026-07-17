import { db } from "./index";
import * as s from "./schema/index";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding Postgres database...");

  // Default company (tenant) for local/demo use
  let [company] = await db.select().from(s.companies).where(eq(s.companies.slug, "default"));
  if (!company) {
    [company] = await db.insert(s.companies).values({ name: "Default Company", slug: "default", subscriptionStatus: "active" }).returning();
    console.log("Default company created");
  }
  const companyId = company!.id;

  // Pipeline stages
  const existingStages = await db.select().from(s.pipelineStages).where(eq(s.pipelineStages.companyId, companyId));
  if (existingStages.length === 0) {
    await db.insert(s.pipelineStages).values([
      { companyId, name: "Prospecting", order: 1, color: "#6366F1", emoji: "🔍", isDefault: true, probability: 20 },
      { companyId, name: "Kontak Awal", order: 2, color: "#3B82F6", emoji: "📞", isDefault: true, probability: 40 },
      { companyId, name: "Meeting", order: 3, color: "#F59E0B", emoji: "🤝", isDefault: true, probability: 60 },
      { companyId, name: "Proposal", order: 4, color: "#8B5CF6", emoji: "📋", isDefault: true, probability: 80 },
      { companyId, name: "Negosiasi", order: 5, color: "#EC4899", emoji: "💬", isDefault: true, probability: 90 },
      { companyId, name: "Closed Won", order: 6, color: "#10B981", emoji: "✅", isDefault: true, isWon: true, probability: 100 },
      { companyId, name: "Closed Lost", order: 7, color: "#EF4444", emoji: "❌", isDefault: true, isLost: true, probability: 0 },
    ]);
    console.log("Pipeline stages created");
  }

  // Territories
  const existingTerritories = await db.select().from(s.territories).where(eq(s.territories.companyId, companyId));
  if (existingTerritories.length === 0) {
    await db.insert(s.territories).values([
      { companyId, name: "Jakarta Pusat", region: "DKI Jakarta", centerLat: -6.2088, centerLng: 106.8456, zoomLevel: 13 },
      { companyId, name: "Bandung", region: "Jawa Barat", centerLat: -6.9175, centerLng: 107.6191, zoomLevel: 12 },
    ]);
    console.log("Territories created");
  }

  // Users
  const existingUsers = await db.select().from(s.users).where(eq(s.users.companyId, companyId));
  if (existingUsers.length === 0) {
    const pw = await Bun.password.hash("password123", { algorithm: "argon2id" });
    // Manager/agent scoping is territory-based — assign the demo accounts a
    // real territory so team data is actually visible out of the box.
    const [defaultTerritory] = await db.select({ id: s.territories.id }).from(s.territories).where(eq(s.territories.companyId, companyId)).limit(1);
    await db.insert(s.users).values([
      { companyId, email: "admin@visitflow.dev", passwordHash: pw, fullName: "Admin VisitFlow", role: "admin", isActive: true },
      { companyId, email: "manager@visitflow.dev", passwordHash: pw, fullName: "Budi Manager", role: "manager", isActive: true, territoryId: defaultTerritory?.id },
      { companyId, email: "agent@visitflow.dev", passwordHash: pw, fullName: "Andi Agent", role: "agent", dailyTarget: 5, monthlyTarget: 100, isActive: true, territoryId: defaultTerritory?.id },
    ]);
    console.log("Demo users created (password: password123)");
  }

  // Leads
  const existingLeads = await db.select().from(s.leads).where(eq(s.leads.companyId, companyId));
  if (existingLeads.length === 0) {
    const [agent] = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.email, "agent@visitflow.dev")).limit(1);
    const [territory] = await db.select({ id: s.territories.id }).from(s.territories).where(eq(s.territories.companyId, companyId)).limit(1);

    if (agent && territory) {
      await db.insert(s.leads).values([
        { companyId, companyName: "SMA Negeri 1 Jakarta", contactName: "Drs. Budi Santoso", contactTitle: "Kepala Sekolah", phone: "021-3841234", city: "Jakarta Pusat", status: "qualified", qualification: "hot", assignedTo: agent.id, territoryId: territory.id, createdBy: agent.id, latitude: -6.2088, longitude: 106.8456, industry: "education", segment: "education", tags: ["education", "sma"], customFields: { level: "SMA", studentCount: "1200" } },
        { companyId, companyName: "Bank Mandiri KC Jakarta", contactName: "Rina Wijaya", contactTitle: "Branch Manager", phone: "021-52901234", city: "Jakarta Pusat", status: "contacted", qualification: "warm", assignedTo: agent.id, territoryId: territory.id, createdBy: agent.id, latitude: -6.2, longitude: 106.84, industry: "banking", customFields: { loanAmount: "5000000000", riskScore: "2" } },
        { companyId, companyName: "RS Husada Utama", contactName: "dr. Ahmad Fauzi", contactTitle: "Dirut", phone: "021-5678900", city: "Jakarta Pusat", status: "new", qualification: "hot", assignedTo: agent.id, territoryId: territory.id, createdBy: agent.id, latitude: -6.215, longitude: 106.85, industry: "healthcare", customFields: { specialization: "Kardiologi", hospitalType: "RS Swasta" } },
        { companyId, companyName: "PT Property Utama", contactName: "Dewi Lestari", contactTitle: "Sales Director", phone: "08119876543", city: "Jakarta Selatan", status: "new", qualification: "warm", assignedTo: agent.id, territoryId: territory.id, createdBy: agent.id, latitude: -6.25, longitude: 106.8, industry: "property", customFields: { projectName: "Grand Residence", unitType: "Apartment" } },
        { companyId, companyName: "TechStart Indo", contactName: "Rian Kurniawan", contactTitle: "CTO", phone: "08121234567", city: "Jakarta Selatan", status: "qualified", qualification: "hot", assignedTo: agent.id, territoryId: territory.id, createdBy: agent.id, latitude: -6.26, longitude: 106.79, industry: "saas", customFields: { companySize: "51-200", currentTools: "Zoho, Trello" } },
      ]);
      console.log("Demo leads created (5 leads with industry tags)");
    }
  }

  console.log("Seed complete!");
}

// Only auto-run when called directly (not imported)
if (import.meta.main) {
  seed().catch(console.error).finally(() => process.exit(0));
}

export { seed };
