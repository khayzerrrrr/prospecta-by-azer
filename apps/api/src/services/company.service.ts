import { db, companies, pipelineStages, users } from "@visitflow/db";
import { eq, and } from "drizzle-orm";
import { INDUSTRIES } from "@visitflow/shared/industries";
import { authService } from "./auth.service";

const GENERIC_STAGES = [
  { name: "Prospecting", order: 1, color: "#6366F1", emoji: "🔍", isDefault: true, probability: 20 },
  { name: "Kontak Awal", order: 2, color: "#3B82F6", emoji: "📞", isDefault: true, probability: 40 },
  { name: "Meeting", order: 3, color: "#F59E0B", emoji: "🤝", isDefault: true, probability: 60 },
  { name: "Proposal", order: 4, color: "#8B5CF6", emoji: "📋", isDefault: true, probability: 80 },
  { name: "Negosiasi", order: 5, color: "#EC4899", emoji: "💬", isDefault: true, probability: 90 },
  { name: "Closed Won", order: 6, color: "#10B981", emoji: "✅", isDefault: true, isWon: true, probability: 100 },
  { name: "Closed Lost", order: 7, color: "#EF4444", emoji: "❌", isDefault: true, isLost: true, probability: 0 },
];

function generateClaimCode(): string {
  // 12 uppercase alphanumeric chars — long/random enough that this is
  // impractical to guess, since this is a public unauthenticated endpoint.
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
}

class CompanyService {
  async list() {
    const rows = await db.select().from(companies);
    const claimed = await db.select({ companyId: users.companyId }).from(users).where(eq(users.role, "super_admin"));
    const claimedIds = new Set(claimed.map((r) => r.companyId));
    return rows.map((c) => ({ ...c, isClaimed: claimedIds.has(c.id) }));
  }

  async create(data: { name: string; industry?: string | null; subscriptionStatus?: string }) {
    const claimCode = generateClaimCode();
    const [company] = await db.insert(companies).values({
      name: data.name,
      slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + crypto.randomUUID().slice(0, 6),
      industry: data.industry || null,
      subscriptionStatus: (data.subscriptionStatus as any) || "trial",
      claimCode,
    }).returning();

    const industrySpec = data.industry ? INDUSTRIES[data.industry] : null;
    const stages = industrySpec
      ? industrySpec.pipelineStages.map((st, i) => ({
          companyId: company!.id, name: st.name, order: i + 1, color: st.color, emoji: st.emoji,
          isWon: !!st.isWon, isLost: !!st.isLost, probability: st.probability,
        }))
      : GENERIC_STAGES.map((st) => ({ ...st, companyId: company!.id }));
    await db.insert(pipelineStages).values(stages);

    return company!;
  }

  async update(id: string, data: { industry?: string | null; subscriptionStatus?: string; isActive?: boolean }) {
    const fields: any = {};
    for (const key of ["industry", "subscriptionStatus", "isActive"]) {
      if ((data as any)[key] !== undefined) fields[key] = (data as any)[key];
    }
    await db.update(companies).set({ ...fields, updatedAt: new Date() }).where(eq(companies.id, id));
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    if (!company) throw new Error("Company not found");
    return company;
  }

  async regenerateCode(id: string) {
    const claimCode = generateClaimCode();
    await db.update(companies).set({ claimCode, updatedAt: new Date() }).where(eq(companies.id, id));
    return { claimCode };
  }

  // Public self-signup: the company itself claims its one super_admin
  // account using the name + code master_account shared out-of-band.
  async claimCompany(data: { companyName: string; claimCode: string; fullName: string; jobTitle?: string; email: string; password: string }) {
    const [company] = await db.select().from(companies)
      .where(and(eq(companies.name, data.companyName), eq(companies.claimCode, data.claimCode)));
    if (!company) throw new Error("Nama perusahaan atau kode klaim tidak valid");

    const [existingAdmin] = await db.select().from(users).where(and(eq(users.companyId, company.id), eq(users.role, "super_admin")));
    if (existingAdmin) throw new Error("Perusahaan ini sudah memiliki akun admin");

    const existingEmail = await db.select().from(users).where(and(eq(users.companyId, company.id), eq(users.email, data.email)));
    if (existingEmail.length > 0) throw new Error("Email sudah terdaftar di perusahaan ini");

    const passwordHash = await Bun.password.hash(data.password, { algorithm: "argon2id" });
    const id = crypto.randomUUID();
    await db.insert(users).values({
      id, companyId: company.id, email: data.email, passwordHash, fullName: data.fullName,
      jobTitle: data.jobTitle || null, role: "super_admin", isActive: true,
    });

    return authService.issueSession(id);
  }
}

export const companyService = new CompanyService();
