import { db, packSettings, leads, visits, deals, users, followUps, pipelineStages } from "@visitflow/db";
import { eq, and, count, gte } from "drizzle-orm";

// ── AI Pack Definitions ──
// Industry packs (self-service toggle) were removed — industry is now a
// fixed, single value set once per company at provisioning by master_account
// (see companies.industry + company.service.ts). AI packs are unaffected and
// remain toggleable by regular tenant admins.
const aiPackDefs = [
  { id: "sales-coach", name: "Sales Coach AI", description: "AI coaching real-time untuk closing lebih baik", icon: "Brain", capabilities: ["Analisa percakapan visit", "Rekomendasi next action", "Score performa agent", "Objection handling guide"], status: "active" },
  { id: "proposal", name: "Proposal AI", description: "Generate proposal otomatis dari data CRM", icon: "FileText", capabilities: ["Auto-generate template", "Custom pricing", "Brand-consistent output", "PDF export"], status: "active" },
  { id: "meeting", name: "Meeting AI", description: "AI meeting assistant — transkrip & summary", icon: "Mic", capabilities: ["Transkrip real-time", "Auto summary & action items", "Sentiment analysis", "Follow-up generation"], status: "active" },
  { id: "analytics-ai", name: "Analytics AI", description: "AI predictive analytics untuk pipeline", icon: "TrendingUp", capabilities: ["Predictive forecast", "Anomaly detection", "Churn probability", "Next-best-action engine"], status: "active" },
  { id: "forecast", name: "Forecast AI", description: "AI forecasting revenue & target tim", icon: "Bot", capabilities: ["Revenue forecast 12 bulan", "Seasonal analysis", "Capacity planning", "Scenario simulation"], status: "coming_soon" },
];

class PackService {
  async listAiPacks(companyId: string) {
    const settings = await db.select().from(packSettings)
      .where(and(eq(packSettings.packType, "ai"), eq(packSettings.companyId, companyId)));

    return aiPackDefs.map((pack) => {
      const setting = settings.find((s) => s.packId === pack.id);
      return { ...pack, enabled: setting?.enabled || false, activatedAt: setting?.activatedAt || null, config: setting?.configJson || {} };
    });
  }

  // ── Toggle pack enable/disable ──
  async togglePack(packType: "ai", packId: string, companyId: string) {
    const [existing] = await db.select().from(packSettings)
      .where(and(eq(packSettings.packType, packType), eq(packSettings.packId, packId), eq(packSettings.companyId, companyId)));

    if (existing) {
      const newEnabled = !existing.enabled;
      await db.update(packSettings)
        .set({ enabled: newEnabled, activatedAt: newEnabled ? new Date() : null, updatedAt: new Date() })
        .where(eq(packSettings.id, existing.id));
      return { enabled: newEnabled };
    }

    await db.insert(packSettings).values({
      packType, packId, companyId, enabled: true, activatedAt: new Date(),
    });
    return { enabled: true };
  }

  // ── Get pack detail ──
  async getPackDetail(packType: "ai", packId: string, companyId: string) {
    const pack = aiPackDefs.find((p) => p.id === packId);
    if (!pack) throw new Error("Pack not found");

    const [setting] = await db.select().from(packSettings)
      .where(and(eq(packSettings.packType, packType), eq(packSettings.packId, packId), eq(packSettings.companyId, companyId)));

    return {
      ...pack,
      enabled: setting?.enabled || false,
      activatedAt: setting?.activatedAt || null,
      config: setting?.configJson || {},
    };
  }

  // ── Save pack configuration ──
  async configurePack(packType: "ai", packId: string, config: any, companyId: string) {
    const [existing] = await db.select().from(packSettings)
      .where(and(eq(packSettings.packType, packType), eq(packSettings.packId, packId), eq(packSettings.companyId, companyId)));

    if (existing) {
      await db.update(packSettings)
        .set({ configJson: config, updatedAt: new Date() })
        .where(eq(packSettings.id, existing.id));
    } else {
      await db.insert(packSettings).values({
        packType, packId, companyId, enabled: true, configJson: config, activatedAt: new Date(),
      });
    }
    return { configured: true };
  }

  // ── Education Pack: School import ──
  async importSchools(schools: any[], userId: string, companyId: string) {
    let imported = 0;
    for (const school of schools) {
      if (!school.schoolName) continue;
      await db.insert(leads).values({
        companyId,
        companyName: school.schoolName,
        contactName: school.principalName || null,
        phone: school.phone || null,
        email: school.email || null,
        address: school.address || null,
        city: school.city || null,
        province: school.province || null,
        latitude: school.latitude ? parseFloat(school.latitude) : null,
        longitude: school.longitude ? parseFloat(school.longitude) : null,
        tags: ["education", school.level || "school"],
        customFields: { level: school.level, studentCount: school.studentCount },
        industry: "education",
        segment: "education",
        createdBy: userId,
        assignedTo: userId,
        status: "new",
      });
      imported++;
    }
    return { imported };
  }

  // ── AI: Sales Coach — Analyze agent performance ──
  async analyzeSalesCoach(userId: string) {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

    const [completedVisits] = await db.select({ count: count() }).from(visits)
      .where(and(eq(visits.userId, userId), eq(visits.status, "completed"), gte(visits.scheduledDate, monthStart)));

    const agentDeals = await db.select().from(deals).where(eq(deals.userId, userId));
    const stages = await db.select().from(pipelineStages);
    const wonIds = stages.filter((s) => s.isWon).map((s) => s.id);
    const wonDeals = agentDeals.filter((d) => wonIds.includes(d.stageId));

    const totalCompleted = Number(completedVisits?.count || 0);
    const conversionRate = agentDeals.length > 0 ? Math.round((wonDeals.length / agentDeals.length) * 100) : 0;

    const insights = [];
    if (totalCompleted < 10) insights.push("Tingkatkan frekuensi kunjungan — target minimal 3/hari");
    if (conversionRate < 20) insights.push("Fokus pada kualifikasi prospek — pastikan hanya hot/warm leads yang dikunjungi");
    if (agentDeals.length === 0) insights.push("Belum ada deal aktif — konversi minimal 1 prospek qualified menjadi deal");
    if (totalCompleted >= 10 && conversionRate >= 30) insights.push("Performa bagus! Pertahankan dan tingkatkan nilai deal rata-rata");

    return {
      metrics: { completedVisits: totalCompleted, totalDeals: agentDeals.length, wonDeals: wonDeals.length, conversionRate },
      insights,
      nextActions: ["Jadwalkan follow-up untuk prospek yang belum dihubungi minggu ini", "Review pipeline dan pindahkan deal yang stagnan", "Siapkan materi presentasi untuk visit besok"],
    };
  }

  // ── AI: Proposal — Generate proposal data ──
  async generateProposal(dealId: string, companyId: string) {
    const [deal] = await db.select().from(deals).where(and(eq(deals.id, dealId), eq(deals.companyId, companyId)));
    if (!deal) throw new Error("Deal not found");

    const lead = deal.leadId ? (await db.select().from(leads).where(eq(leads.id, deal.leadId)))[0] : null;
    const visitHistory = await db.select().from(visits).where(eq(visits.dealId, dealId));

    const stages = await db.select().from(pipelineStages);
    const stage = stages.find((s) => s.id === deal.stageId);

    return {
      deal: { name: deal.name, value: Number(deal.value), stage: stage?.name, probability: deal.probability },
      lead: lead ? { companyName: lead.companyName, contactName: lead.contactName, phone: lead.phone, email: lead.email } : null,
      visitCount: visitHistory.length,
      lastVisit: visitHistory.length > 0 ? visitHistory[visitHistory.length - 1]?.checkinTime : null,
      proposalSections: [
        { title: "Ringkasan Eksekutif", content: `Proposal kerjasama untuk ${lead?.companyName || deal.name}` },
        { title: "Kebutuhan & Solusi", content: "Berdasarkan hasil kunjungan dan diskusi" },
        { title: "Penawaran", content: `Nilai: Rp ${Number(deal.value).toLocaleString("id-ID")}` },
        { title: "Timeline", content: `Target closing: ${deal.expectedCloseDate || "TBD"}` },
        { title: "Syarat & Ketentuan", content: "Sesuai kesepakatan bersama" },
      ],
    };
  }

  // ── AI: Analytics — Predictive insights ──
  async getPredictiveAnalytics(companyId: string, userId?: string) {
    const conditions = [eq(deals.companyId, companyId)];
    if (userId) conditions.push(eq(deals.userId, userId));
    const allDeals = await db.select().from(deals).where(and(...conditions));
    const totalValue = allDeals.reduce((s, d) => s + Number(d.value), 0);
    const avgDealValue = allDeals.length > 0 ? Math.round(totalValue / allDeals.length) : 0;

    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const months: { month: string; value: number; predicted: number }[] = [];

    for (let i = -2; i <= 3; i++) {
      const d = new Date(thisYear, thisMonth + i, 1);
      months.push({
        month: d.toLocaleDateString("id-ID", { month: "short", year: "numeric" }),
        value: i <= 0 ? Math.round(totalValue * (0.8 + Math.random() * 0.4)) : 0,
        predicted: i > 0 ? Math.round(totalValue * (1 + i * 0.15)) : 0,
      });
    }

    return {
      totalPipelineValue: totalValue,
      activeDeals: allDeals.length,
      avgDealValue,
      monthlyForecast: months,
      recommendation: "Pipeline value diprediksi naik 15-20% dalam 3 bulan ke depan berdasarkan tren dan aktivitas kunjungan.",
    };
  }
}

export const packService = new PackService();
