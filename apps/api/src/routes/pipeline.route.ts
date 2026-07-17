import { Elysia } from "elysia";
import { db, pipelineStages, deals, leads, users } from "@visitflow/db";
import { eq, and, inArray, sql, or } from "drizzle-orm";
import { getAuthUser } from "../middleware/auth";
import { requirePermission, getSubordinateUserIds } from "../middleware/rbac";
import { getJobTitleLevel } from "@visitflow/shared/constants/job-titles";
import { ownershipGuard } from "../middleware/ownership";
import { UnauthorizedError } from "../utils/errors";

const dealOwnership = ownershipGuard(async (id: string) => {
  const [deal] = await db.select().from(deals).where(eq(deals.id, id));
  if (!deal) return undefined;
  const lead = deal.leadId ? (await db.select().from(leads).where(eq(leads.id, deal.leadId)))[0] : undefined;
  const [owner] = await db.select({ jobTitle: users.jobTitle }).from(users).where(eq(users.id, deal.userId));
  return { ownerId: deal.userId, ownerJobTitle: owner?.jobTitle ?? null, territoryId: lead?.territoryId ?? null, companyId: deal.companyId };
});

export const pipelineRoutes = new Elysia({ prefix: "/pipeline" })
  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    if (!user) throw new UnauthorizedError();
    return { user };
  })
  .get("/stages", async ({ user }) => {
    const stages = await db.select().from(pipelineStages).where(eq(pipelineStages.companyId, user.companyId!));
    return { success: true, data: stages };
  }, { beforeHandle: requirePermission("pipeline:read") })
  .get("/deals", async ({ query, user }) => {
    const stageId = (query as any).stageId;
    const conditions = [eq(deals.companyId, user.companyId!)];
    if (stageId) conditions.push(eq(deals.stageId, stageId));

    if (user.role !== "super_admin" && user.role !== "admin") {
      // Union of: own deals, (manager) deals tied to territory leads,
      // (hierarchy) deals owned by subordinate job titles — never a
      // replacement for any of these, only ever widens visibility.
      const scopeConditions = [eq(deals.userId, user.id)];
      if (user.role === "manager" && user.territoryId) {
        const territoryLeadIds = (await db.select({ id: leads.id }).from(leads).where(eq(leads.territoryId, user.territoryId))).map((l) => l.id);
        if (territoryLeadIds.length > 0) scopeConditions.push(inArray(deals.leadId, territoryLeadIds));
      }
      const viewerLevel = getJobTitleLevel(user.jobTitle);
      if (viewerLevel > 1) {
        const subordinateIds = await getSubordinateUserIds(user.companyId!, viewerLevel);
        if (subordinateIds.length > 0) scopeConditions.push(inArray(deals.userId, subordinateIds));
      }
      conditions.push(or(...scopeConditions)!);
    }

    const data = await db.select().from(deals).where(and(...conditions));
    return { success: true, data };
  }, { beforeHandle: requirePermission("pipeline:read") })
  .post("/deals", async ({ body, user }) => {
    const id = crypto.randomUUID();
    await db.insert(deals).values({ id, ...(body as any), companyId: user.companyId!, userId: user.id });
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return { success: true, data: deal };
  }, { beforeHandle: requirePermission("pipeline:write") })
  .patch("/deals/:id", async ({ params, body }) => {
    await db.update(deals).set({ ...(body as any), updatedAt: new Date() }).where(eq(deals.id, params.id));
    const [deal] = await db.select().from(deals).where(eq(deals.id, params.id));
    return { success: true, data: deal };
  }, { beforeHandle: [requirePermission("pipeline:write"), dealOwnership] });
