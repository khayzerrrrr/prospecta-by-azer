import { db } from "./index";
import * as s from "./schema/index";

async function seed() {
  console.log("Seeding SQLite database...");

  // Pipeline stages
  const existingStages = db.select().from(s.pipelineStages).all();
  if (existingStages.length === 0) {
    const stages = [
      { name: "Prospecting", order: 1, color: "#6366F1", emoji: "🔍", isDefault: true, probability: 20 },
      { name: "Kontak Awal", order: 2, color: "#3B82F6", emoji: "📞", isDefault: true, probability: 40 },
      { name: "Meeting", order: 3, color: "#F59E0B", emoji: "🤝", isDefault: true, probability: 60 },
      { name: "Proposal", order: 4, color: "#8B5CF6", emoji: "📋", isDefault: true, probability: 80 },
      { name: "Negosiasi", order: 5, color: "#EC4899", emoji: "💬", isDefault: true, probability: 90 },
      { name: "Closed Won", order: 6, color: "#10B981", emoji: "✅", isDefault: true, isWon: true, probability: 100 },
      { name: "Closed Lost", order: 7, color: "#EF4444", emoji: "❌", isDefault: true, isLost: true, probability: 0 },
    ];
    stages.forEach((st) => db.insert(s.pipelineStages).values(st).run());
    console.log("Pipeline stages created");
  }

  // Territories
  const existingTerritories = db.select().from(s.territories).all();
  if (existingTerritories.length === 0) {
    db.insert(s.territories).values([
      { name: "Jakarta Pusat", region: "DKI Jakarta", centerLat: -6.2088, centerLng: 106.8456, zoomLevel: 13 },
      { name: "Bandung", region: "Jawa Barat", centerLat: -6.9175, centerLng: 107.6191, zoomLevel: 12 },
    ]).run();
    console.log("Territories created");
  }

  // Users
  const existingUsers = db.select().from(s.users).all();
  if (existingUsers.length === 0) {
    const pw = await Bun.password.hash("password123", { algorithm: "argon2id" });
    db.insert(s.users).values([
      { email: "admin@visitflow.dev", passwordHash: pw, fullName: "Admin VisitFlow", role: "admin", isActive: true },
      { email: "manager@visitflow.dev", passwordHash: pw, fullName: "Budi Manager", role: "manager", isActive: true },
      { email: "agent@visitflow.dev", passwordHash: pw, fullName: "Andi Agent", role: "agent", dailyTarget: 5, monthlyTarget: 100, isActive: true },
    ]).run();
    console.log("Demo users created (password: password123)");
  }

  // Leads
  const existingLeads = db.select().from(s.leads).all();
  if (existingLeads.length === 0) {
    const [agent] = db.select({ id: s.users.id }).from(s.users).where(eq(s.users.email, "agent@visitflow.dev")).limit(1).all();
    const [territory] = db.select({ id: s.territories.id }).from(s.territories).limit(1).all();

    if (agent && territory) {
      db.insert(s.leads).values([
        { companyName: "SMA Negeri 1 Jakarta", contactName: "Drs. Budi Santoso", contactTitle: "Kepala Sekolah", phone: "021-3841234", city: "Jakarta Pusat", status: "qualified", qualification: "hot", assignedTo: agent.id, territoryId: territory.id, createdBy: agent.id, latitude: -6.2088, longitude: 106.8456, industry: "education", segment: "education", tags: '["education","sma"]', customFields: '{"level":"SMA","studentCount":"1200"}' },
        { companyName: "Bank Mandiri KC Jakarta", contactName: "Rina Wijaya", contactTitle: "Branch Manager", phone: "021-52901234", city: "Jakarta Pusat", status: "contacted", qualification: "warm", assignedTo: agent.id, territoryId: territory.id, createdBy: agent.id, latitude: -6.2, longitude: 106.84, industry: "banking", customFields: '{"loanAmount":"5000000000","riskScore":"2"}' },
        { companyName: "RS Husada Utama", contactName: "dr. Ahmad Fauzi", contactTitle: "Dirut", phone: "021-5678900", city: "Jakarta Pusat", status: "new", qualification: "hot", assignedTo: agent.id, territoryId: territory.id, createdBy: agent.id, latitude: -6.215, longitude: 106.85, industry: "healthcare", customFields: '{"specialization":"Kardiologi","hospitalType":"RS Swasta"}' },
        { companyName: "PT Property Utama", contactName: "Dewi Lestari", contactTitle: "Sales Director", phone: "08119876543", city: "Jakarta Selatan", status: "new", qualification: "warm", assignedTo: agent.id, territoryId: territory.id, createdBy: agent.id, latitude: -6.25, longitude: 106.8, industry: "property", customFields: '{"projectName":"Grand Residence","unitType":"Apartment"}' },
        { companyName: "TechStart Indo", contactName: "Rian Kurniawan", contactTitle: "CTO", phone: "08121234567", city: "Jakarta Selatan", status: "qualified", qualification: "hot", assignedTo: agent.id, territoryId: territory.id, createdBy: agent.id, latitude: -6.26, longitude: 106.79, industry: "saas", customFields: '{"companySize":"51-200","currentTools":"Zoho, Trello"}' },
      ]).run();
      console.log("Demo leads created (5 leads with industry tags)");
    }
  }

  console.log("Seed complete!");
}

import { eq } from "drizzle-orm";
seed().catch(console.error).finally(() => process.exit(0));
