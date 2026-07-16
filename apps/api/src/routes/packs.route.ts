import { Elysia, t } from "elysia";
import { packService } from "../services/pack.service";
import { getAuthUser } from "../middleware/auth";

export const packRoutes = new Elysia({ prefix: "/packs" })
  // ─── Public: Onboarding (no auth required) ─────────
  .post("/onboard/:type/:id", async ({ params }) => {
    const { type, id } = params as { type: string; id: string };
    if (!["industry", "ai"].includes(type)) return { success: false, error: "Invalid type" };
    // Enable pack
    await packService.togglePack(type as "industry" | "ai", id);
    // Configure
    await packService.configurePack(type as "industry" | "ai", id, { installed: true, installedAt: new Date().toISOString() });
    return { success: true, data: { enabled: true } };
  })

  // ─── Auth required below ───────────────────────────
  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    if (!user) throw new Error("Unauthorized");
    return { user };
  })

  // ─── Industry Packs ───────────────────────────────

  .get("/industry", async () => {
    const packs = await packService.listIndustryPacks();
    return { success: true, data: packs };
  })

  .get("/industry/:id", async ({ params }) => {
    const pack = await packService.getPackDetail("industry", params.id);
    return { success: true, data: pack };
  })

  .post("/industry/:id/toggle", async ({ params }) => {
    const result = await packService.togglePack("industry", params.id);
    return { success: true, data: result };
  })

  .post("/industry/:id/configure", async ({ params, body }) => {
    const result = await packService.configurePack("industry", params.id, body);
    return { success: true, data: result };
  })

  // Education — School import
  .post("/industry/education/import-schools", async ({ body, user }) => {
    const { schools } = body as any;
    if (!Array.isArray(schools) || schools.length === 0) {
      return { success: false, error: "No schools data provided" };
    }
    const result = await packService.importSchools(schools, user.id);
    return { success: true, data: result };
  }, {
    body: t.Object({
      schools: t.Array(t.Object({
        schoolName: t.String(),
        principalName: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        email: t.Optional(t.String()),
        address: t.Optional(t.String()),
        city: t.Optional(t.String()),
        province: t.Optional(t.String()),
        level: t.Optional(t.String()),
        studentCount: t.Optional(t.String()),
        latitude: t.Optional(t.String()),
        longitude: t.Optional(t.String()),
      })),
    }),
  })

  // ─── AI Packs ────────────────────────────────────

  .get("/ai", async () => {
    const packs = await packService.listAiPacks();
    return { success: true, data: packs };
  })

  .get("/ai/:id", async ({ params }) => {
    const pack = await packService.getPackDetail("ai", params.id);
    return { success: true, data: pack };
  })

  .post("/ai/:id/toggle", async ({ params }) => {
    const result = await packService.togglePack("ai", params.id);
    return { success: true, data: result };
  })

  .post("/ai/:id/configure", async ({ params, body }) => {
    const result = await packService.configurePack("ai", params.id, body);
    return { success: true, data: result };
  })

  // Sales Coach AI
  .get("/ai/sales-coach/analyze", async ({ user }) => {
    const analysis = await packService.analyzeSalesCoach(user.id);
    return { success: true, data: analysis };
  })

  // Proposal AI
  .get("/ai/proposal/generate/:dealId", async ({ params }) => {
    const proposal = await packService.generateProposal(params.dealId);
    return { success: true, data: proposal };
  })

  // Meeting AI — placeholder
  .post("/ai/meeting/transcribe", async ({ body }) => {
    // In production: integrate with Whisper/Deepgram API
    return {
      success: true,
      data: {
        transcript: "Transkrip akan tersedia setelah integrasi speech-to-text diaktifkan.",
        summary: "Meeting AI siap digunakan — cukup sambungkan API key.",
        actionItems: ["Integrasikan dengan Whisper API", "Atur webhook untuk auto-save ke timeline lead"],
      },
    };
  })

  // Analytics AI
  .get("/ai/analytics-ai/predict", async () => {
    const analytics = await packService.getPredictiveAnalytics();
    return { success: true, data: analytics };
  })

  // Forecast AI
  .get("/ai/forecast", async () => {
    const analytics = await packService.getPredictiveAnalytics();
    return {
      success: true,
      data: {
        ...analytics,
        status: "coming_soon",
        message: "Forecast AI akan tersedia di rilis berikutnya dengan model ML yang lebih akurat.",
      },
    };
  });
