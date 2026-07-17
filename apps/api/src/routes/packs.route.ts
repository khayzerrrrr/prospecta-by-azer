import { Elysia, t } from "elysia";
import { packService } from "../services/pack.service";
import { getAuthUser } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { UnauthorizedError } from "../utils/errors";

export const packRoutes = new Elysia({ prefix: "/packs" })
  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    if (!user) throw new UnauthorizedError();
    return { user };
  })

  // Education — School import (data utility, not part of the removed
  // industry-pack marketplace — a company's industry is now fixed at
  // provisioning, see company.service.ts)
  .post("/industry/education/import-schools", async ({ body, user }) => {
    const { schools } = body as any;
    if (!Array.isArray(schools) || schools.length === 0) {
      return { success: false, error: "No schools data provided" };
    }
    const result = await packService.importSchools(schools, user.id, user.companyId!);
    return { success: true, data: result };
  }, {
    beforeHandle: requirePermission("leads:import"),
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

  .get("/ai", async ({ user }) => {
    const packs = await packService.listAiPacks(user.companyId!);
    return { success: true, data: packs };
  })

  .get("/ai/:id", async ({ params, user }) => {
    const pack = await packService.getPackDetail("ai", params.id, user.companyId!);
    return { success: true, data: pack };
  })

  .post("/ai/:id/toggle", async ({ params, user }) => {
    const result = await packService.togglePack("ai", params.id, user.companyId!);
    return { success: true, data: result };
  }, { beforeHandle: requirePermission("settings:write") })

  .post("/ai/:id/configure", async ({ params, body, user }) => {
    const result = await packService.configurePack("ai", params.id, body, user.companyId!);
    return { success: true, data: result };
  }, { beforeHandle: requirePermission("settings:write") })

  // Sales Coach AI
  .get("/ai/sales-coach/analyze", async ({ user }) => {
    const analysis = await packService.analyzeSalesCoach(user.id);
    return { success: true, data: analysis };
  }, { beforeHandle: requirePermission("analytics:read") })

  // Proposal AI
  .get("/ai/proposal/generate/:dealId", async ({ params, user }) => {
    const proposal = await packService.generateProposal(params.dealId, user.companyId!);
    return { success: true, data: proposal };
  }, { beforeHandle: requirePermission("pipeline:read") })

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
  }, { beforeHandle: requirePermission("visits:write") })

  // Analytics AI
  .get("/ai/analytics-ai/predict", async ({ user }) => {
    const analytics = await packService.getPredictiveAnalytics(user.companyId!, user.role === "agent" ? user.id : undefined);
    return { success: true, data: analytics };
  }, { beforeHandle: requirePermission("analytics:read") })

  // Forecast AI
  .get("/ai/forecast", async ({ user }) => {
    const analytics = await packService.getPredictiveAnalytics(user.companyId!, user.role === "agent" ? user.id : undefined);
    return {
      success: true,
      data: {
        ...analytics,
        status: "coming_soon",
        message: "Forecast AI akan tersedia di rilis berikutnya dengan model ML yang lebih akurat.",
      },
    };
  }, { beforeHandle: requirePermission("analytics:read") });
