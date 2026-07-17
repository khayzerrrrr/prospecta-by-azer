import { Elysia } from "elysia";
import { db, visits, deals, followUps, users, pipelineStages } from "@visitflow/db";
import { eq, and, gte, count } from "drizzle-orm";
import { getAuthUser } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";

export const analyticsRoutes = new Elysia({ prefix: "/analytics" })
  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    if (!user) throw new UnauthorizedError();
    return { user };
  })
  .get("/summary", async ({ user }) => {
    const isAgent = user.role === "agent";
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

    const todayVisitConds = [eq(visits.companyId, user.companyId!), eq(visits.scheduledDate, today)];
    if (isAgent) todayVisitConds.push(eq(visits.userId, user.id));
    const [todayVisits] = await db.select({ count: count() }).from(visits).where(and(...todayVisitConds));

    const monthVisitConds = [eq(visits.companyId, user.companyId!), eq(visits.status, "completed"), gte(visits.scheduledDate, monthStart)];
    if (isAgent) monthVisitConds.push(eq(visits.userId, user.id));
    const [monthVisits] = await db.select({ count: count() }).from(visits).where(and(...monthVisitConds));

    const dealConds = [eq(deals.companyId, user.companyId!)];
    if (isAgent) dealConds.push(eq(deals.userId, user.id));
    const allDeals = await db.select().from(deals).where(and(...dealConds));
    const pipelineValue = allDeals.reduce((s, d) => s + (Number(d.value) || 0), 0);
    const wonStages = await db.select({ id: pipelineStages.id }).from(pipelineStages).where(and(eq(pipelineStages.companyId, user.companyId!), eq(pipelineStages.isWon, true)));
    const wonIds = wonStages.map((s) => s.id);
    const wonDeals = allDeals.filter((d) => wonIds.includes(d.stageId)).length;
    const conversionRate = allDeals.length > 0 ? Math.round((wonDeals / allDeals.length) * 100) : 0;

    const pendingConds = [eq(followUps.companyId, user.companyId!), eq(followUps.status, "pending")];
    if (isAgent) pendingConds.push(eq(followUps.userId, user.id));
    const [pendingCount] = await db.select({ count: count() }).from(followUps).where(and(...pendingConds));

    return { success: true, data: { todayVisits: Number(todayVisits?.count || 0), monthVisits: Number(monthVisits?.count || 0), pipelineValue, conversionRate, pendingFollowUps: Number(pendingCount?.count || 0) } };
  }, { beforeHandle: requirePermission("analytics:read") })
  .get("/visit-trends", async ({ user }) => {
    const isAgent = user.role === "agent";
    const data: { date: string; planned: number; completed: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const plannedConds = [eq(visits.companyId, user.companyId!), eq(visits.scheduledDate, ds)];
      if (isAgent) plannedConds.push(eq(visits.userId, user.id));
      const [planned] = await db.select({ count: count() }).from(visits).where(and(...plannedConds));
      const completedConds = [eq(visits.companyId, user.companyId!), eq(visits.scheduledDate, ds), eq(visits.status, "completed")];
      if (isAgent) completedConds.push(eq(visits.userId, user.id));
      const [completed] = await db.select({ count: count() }).from(visits).where(and(...completedConds));
      data.push({ date: ds, planned: Number(planned?.count || 0), completed: Number(completed?.count || 0) });
    }
    return { success: true, data };
  }, { beforeHandle: requirePermission("analytics:read") })
  .get("/team-performance", async ({ user }) => {
    // No permission string distinguishes "own analytics" from "everyone's" —
    // both are granted analytics:read, so this needs an explicit role check.
    if (user.role === "agent") throw new ForbiddenError();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const agents = await db.select().from(users).where(and(eq(users.companyId, user.companyId!), eq(users.role, "agent")));
    const performance = await Promise.all(agents.map(async (agent) => {
      const [completed] = await db.select({ count: count() }).from(visits).where(and(eq(visits.userId, agent.id), eq(visits.status, "completed"), gte(visits.scheduledDate, monthStart)));
      const agentDeals = await db.select().from(deals).where(eq(deals.userId, agent.id));
      const totalValue = agentDeals.reduce((s, d) => s + (Number(d.value) || 0), 0);
      return { id: agent.id, fullName: agent.fullName, email: agent.email, dailyTarget: agent.dailyTarget, monthlyTarget: agent.monthlyTarget, completedVisits: Number(completed?.count || 0), totalDeals: agentDeals.length, totalValue, completionRate: agent.monthlyTarget ? Math.round((Number(completed?.count || 0) / Number(agent.monthlyTarget)) * 100) : 0 };
    }));
    return { success: true, data: performance };
  }, { beforeHandle: requirePermission("analytics:read") });
