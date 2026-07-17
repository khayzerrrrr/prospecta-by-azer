import { Elysia, t } from "elysia";
import { kpiService } from "../services/kpi.service";
import { employeeService } from "../services/employee.service";
import { getAuthUser } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";

export const kpiRoutes = new Elysia({ prefix: "/kpi" })
  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    if (!user) throw new UnauthorizedError();
    return { user };
  })
  .get("/definitions", async ({ user }) => {
    const data = await kpiService.listDefinitions(user.companyId!);
    return { success: true, data };
  }, { beforeHandle: requirePermission("kpi:read") })
  .post("/definitions", async ({ body, user }) => {
    if (user.role !== "admin" && user.role !== "super_admin") throw new ForbiddenError("Hanya HR/admin yang bisa membuat KPI");
    const data = await kpiService.createDefinition(user.companyId!, body);
    return { success: true, data };
  }, {
    beforeHandle: requirePermission("kpi:write"),
    body: t.Object({
      name: t.String(), description: t.Optional(t.String()), unit: t.String(),
      targetValue: t.Optional(t.Number()), weight: t.Optional(t.Number()),
      appliesTo: t.Optional(t.Union([t.Literal("all"), t.Literal("office"), t.Literal("field")])),
    }),
  })
  .patch("/definitions/:id", async ({ params, body, user }) => {
    if (user.role !== "admin" && user.role !== "super_admin") throw new ForbiddenError("Hanya HR/admin yang bisa mengubah KPI");
    const data = await kpiService.updateDefinition(params.id, body);
    return { success: true, data };
  }, { beforeHandle: requirePermission("kpi:write") })

  .get("/scores", async ({ query, user }) => {
    const month = Number(query.periodMonth) || new Date().getMonth() + 1;
    const year = Number(query.periodYear) || new Date().getFullYear();
    const data = await kpiService.listScoresForPeriod(user, month, year);
    return { success: true, data };
  }, { beforeHandle: requirePermission("kpi:read") })

  .get("/employees/:employeeProfileId/summary", async ({ params, query, user }) => {
    const month = Number(query.periodMonth) || new Date().getMonth() + 1;
    const year = Number(query.periodYear) || new Date().getFullYear();
    if (user.role === "agent") {
      const own = await employeeService.getByUserId(user.id).catch(() => null);
      if (!own || own.id !== params.employeeProfileId) throw new ForbiddenError();
    }
    const data = await kpiService.getEmployeeSummary(params.employeeProfileId, month, year);
    return { success: true, data };
  }, { beforeHandle: requirePermission("kpi:read") })

  .post("/scores", async ({ body, user }) => {
    if (user.role === "agent") throw new ForbiddenError("Agent tidak bisa menilai KPI");
    try {
      const id = await kpiService.upsertScore(user.companyId!, user.id, body);
      return { success: true, data: { id } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }, {
    beforeHandle: requirePermission("kpi:write"),
    body: t.Object({
      employeeProfileId: t.String(), kpiDefinitionId: t.String(),
      periodMonth: t.Number(), periodYear: t.Number(),
      targetValue: t.Optional(t.Number()), actualValue: t.Number(), notes: t.Optional(t.String()),
    }),
  });
