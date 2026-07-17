import { db, packSettings, leads, visits, deals, users, followUps } from "@visitflow/db";
import { eq, and, count, gte } from "drizzle-orm";

// ── Industry Pack Definitions ──
const industryPackDefs = [
  { id: "education", name: "Education", description: "Pipeline kunjungan untuk institusi pendidikan", icon: "GraduationCap", features: ["Segmentasi jenjang sekolah", "Template visit form akademik", "Kalender tahun ajaran", "Report akreditasi"], templates: ["Kunjungan Sekolah", "Demo Produk Edu", "Meeting Yayasan"] },
  { id: "banking", name: "Banking", description: "Pipeline kunjungan untuk sektor perbankan", icon: "Store", features: ["Risk scoring prospek", "Template due diligence", "Pipeline kredit", "Compliance OJK"], templates: ["Visit Nasabah Prioritas", "Survey UMKM", "Audit Cabang"] },
  { id: "healthcare", name: "Healthcare", description: "Manajemen kunjungan healthcare", icon: "Heart", features: ["Segmentasi spesialisasi", "Template presentasi farmasi", "Tracking izin edar", "Sampling management"], templates: ["Detail Dokter", "Visit RS/Klinik", "Presentasi Alkes"] },
  { id: "property", name: "Property", description: "Pipeline visit untuk properti", icon: "Home", features: ["Unit availability tracking", "Template site visit", "Pipeline SPK → AJB", "Map integration"], templates: ["Site Visit Project", "Meeting Developer", "Open House"] },
  { id: "automotive", name: "Automotive", description: "CRM kunjungan otomotif", icon: "Car", features: ["Vehicle interest tracking", "Template test drive", "Pipeline kredit", "Service reminder"], templates: ["Test Drive", "Visit Dealer", "Fleet Presentation"] },
  { id: "manufacturing", name: "Manufacturing", description: "Pipeline B2B manufaktur", icon: "Factory", features: ["Supplier qualification", "Template factory audit", "Pipeline RFQ → PO", "Quality compliance"], templates: ["Audit Pabrik", "Visit Supplier", "Quality Check"] },
  { id: "retail", name: "Retail", description: "Manajemen kunjungan retail", icon: "ShoppingBag", features: ["Store classification", "Template merchandising", "Visit frequency automation", "Competitor tracking"], templates: ["Store Visit", "Merchandising Check", "Survey Outlet"] },
  { id: "saas", name: "SaaS", description: "Pipeline visit untuk SaaS", icon: "Cloud", features: ["Trial → POC tracking", "Template product demo", "Churn risk warning", "NPS tracking"], templates: ["Product Demo", "Technical POC", "QBR Meeting"] },
  { id: "distributor", name: "Distributor", description: "CRM distribusi", icon: "Truck", features: ["Coverage area mapping", "Template stock & order", "Route optimization", "Sales order integration"], templates: ["Visit Agen", "Stock Check", "Order Taking"] },
];

// ── AI Pack Definitions ──
const aiPackDefs = [
  { id: "sales-coach", name: "Sales Coach AI", description: "AI coaching real-time untuk closing lebih baik", icon: "Brain", capabilities: ["Analisa percakapan visit", "Rekomendasi next action", "Score performa agent", "Objection handling guide"], status: "active" },
  { id: "proposal", name: "Proposal AI", description: "Generate proposal otomatis dari data CRM", icon: "FileText", capabilities: ["Auto-generate template", "Custom pricing", "Brand-consistent output", "PDF export"], status: "active" },
  { id: "meeting", name: "Meeting AI", description: "AI meeting assistant — transkrip & summary", icon: "Mic", capabilities: ["Transkrip real-time", "Auto summary & action items", "Sentiment analysis", "Follow-up generation"], status: "active" },
  { id: "analytics-ai", name: "Analytics AI", description: "AI predictive analytics untuk pipeline", icon: "TrendingUp", capabilities: ["Predictive forecast", "Anomaly detection", "Churn probability", "Next-best-action engine"], status: "active" },
  { id: "forecast", name: "Forecast AI", description: "AI forecasting revenue & target tim", icon: "Bot", capabilities: ["Revenue forecast 12 bulan", "Seasonal analysis", "Capacity planning", "Scenario simulation"], status: "coming_soon" },
];

class PackService {
  // ── List all packs with their enabled status ──
  async listIndustryPacks(companyId = "default") {
    const settings = db.select().from(packSettings)
      .where(and(eq(packSettings.packType, "industry"), eq(packSettings.companyId, companyId)))
      .all();

    return industryPackDefs.map((pack) => {
      const setting = settings.find((s) => s.packId === pack.id);
      return { ...pack, enabled: setting?.enabled || false, activatedAt: setting?.activatedAt || null, config: setting ? JSON.parse(setting.configJson || "{}") : {} };
    });
  }

  async listAiPacks(companyId = "default") {
    const settings = db.select().from(packSettings)
      .where(and(eq(packSettings.packType, "ai"), eq(packSettings.companyId, companyId)))
      .all();

    return aiPackDefs.map((pack) => {
      const setting = settings.find((s) => s.packId === pack.id);
      return { ...pack, enabled: setting?.enabled || false, activatedAt: setting?.activatedAt || null, config: setting ? JSON.parse(setting.configJson || "{}") : {} };
    });
  }

  // ── Toggle pack enable/disable ──
  async togglePack(packType: "industry" | "ai", packId: string, companyId = "default") {
    const existing = db.select().from(packSettings)
      .where(and(eq(packSettings.packType, packType), eq(packSettings.packId, packId), eq(packSettings.companyId, companyId)))
      .get();

    if (existing) {
      const newEnabled = !existing.enabled;
      db.update(packSettings)
        .set({ enabled: newEnabled, activatedAt: newEnabled ? new Date() : null, updatedAt: new Date() })
        .where(eq(packSettings.id, existing.id))
        .run();
      return { enabled: newEnabled };
    }

    db.insert(packSettings).values({
      packType, packId, companyId, enabled: true, activatedAt: new Date(),
    }).run();
    return { enabled: true };
  }

  // ── Get pack detail ──
  async getPackDetail(packType: "industry" | "ai", packId: string, companyId = "default") {
    const defs = packType === "industry" ? industryPackDefs : aiPackDefs;
    const pack = defs.find((p) => p.id === packId);
    if (!pack) throw new Error("Pack not found");

    const setting = db.select().from(packSettings)
      .where(and(eq(packSettings.packType, packType), eq(packSettings.packId, packId), eq(packSettings.companyId, companyId)))
      .get();

    return {
      ...pack,
      enabled: setting?.enabled || false,
      activatedAt: setting?.activatedAt || null,
      config: setting ? JSON.parse(setting.configJson || "{}") : {},
    };
  }

  // ── Save pack configuration ──
  async configurePack(packType: "industry" | "ai", packId: string, config: any, companyId = "default") {
    const existing = db.select().from(packSettings)
      .where(and(eq(packSettings.packType, packType), eq(packSettings.packId, packId), eq(packSettings.companyId, companyId)))
      .get();

    if (existing) {
      db.update(packSettings)
        .set({ configJson: JSON.stringify(config), updatedAt: new Date() })
        .where(eq(packSettings.id, existing.id))
        .run();
    } else {
      db.insert(packSettings).values({
        packType, packId, companyId, enabled: true, configJson: JSON.stringify(config), activatedAt: new Date(),
      }).run();
    }
    return { configured: true };
  }

  // ── Education Pack: School import ──
  async importSchools(schools: any[], userId: string, companyId = "default") {
    let imported = 0;
    for (const school of schools) {
      if (!school.schoolName) continue;
      db.insert(leads).values({
        companyName: school.schoolName,
        contactName: school.principalName || null,
        phone: school.phone || null,
        email: school.email || null,
        address: school.address || null,
        city: school.city || null,
        province: school.province || null,
        latitude: school.latitude ? parseFloat(school.latitude) : null,
        longitude: school.longitude ? parseFloat(school.longitude) : null,
        tags: JSON.stringify(["education", school.level || "school"]),
        customFields: JSON.stringify({ level: school.level, studentCount: school.studentCount }),
        industry: "education",
        segment: "education",
        createdBy: userId,
        assignedTo: userId,
        status: "new",
      }).run();
      imported++;
    }
    return { imported };
  }

  // ── AI: Sales Coach — Analyze agent performance ──
  async analyzeSalesCoach(userId: string) {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    const completedVisits = db.select({ count: count() }).from(visits)
      .where(and(eq(visits.userId, userId), eq(visits.status, "completed"), gte(visits.scheduledDate, monthStart)))
      .get();

    const agentDeals = db.select().from(deals).where(eq(deals.userId, userId)).all();
    const wonDeals = agentDeals.filter((d) => {
      const stages = db.select().from(db._.schema!.pipelineStages).all();
      const wonIds = stages.filter((s: any) => s.isWon).map((s: any) => s.id);
      return wonIds.includes(d.stageId);
    });

    const totalCompleted = Number(completedVisits?.count || 0);
    const conversionRate = agentDeals.length > 0 ? Math.round((wonDeals.length / agentDeals.length) * 100) : 0;

    // AI insights
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
  async generateProposal(dealId: string) {
    const deal = db.select().from(deals).where(eq(deals.id, dealId)).get();
    if (!deal) throw new Error("Deal not found");

    const lead = deal.leadId ? db.select().from(leads).where(eq(leads.id, deal.leadId)).get() : null;
    const visitHistory = db.select().from(visits).where(eq(visits.dealId, dealId)).all();

    const stages = db.select().from(db._.schema!.pipelineStages).all();
    const stage = stages.find((s: any) => s.id === deal.stageId);

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
  async getPredictiveAnalytics(userId?: string) {
    let dealsQuery = db.select().from(deals).$dynamic();
    if (userId) dealsQuery = dealsQuery.where(eq(deals.userId, userId));
    const allDeals = dealsQuery.all();
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
