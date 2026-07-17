import { Elysia } from "elysia";
import { db, pipelineStages, deals, leads } from "@visitflow/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import { getAuthUser } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { ownershipGuard } from "../middleware/ownership";
import { UnauthorizedError } from "../utils/errors";

const dealOwnership = ownershipGuard((id: string) => {
  const deal = db.select().from(deals).where(eq(deals.id, id)).get();
  if (!deal) return undefined;
  const lead = deal.leadId ? db.select().from(leads).where(eq(leads.id, deal.leadId)).get() : undefined;
  return { ownerId: deal.userId, territoryId: lead?.territoryId ?? null };
});

export const pipelineRoutes = new Elysia({ prefix: "/pipeline" })
  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    if (!user) throw new UnauthorizedError();
    return { user };
  })
  .get("/stages", async () => {
    const stages = db.select().from(pipelineStages).all();
    return { success: true, data: stages };
  }, { beforeHandle: requirePermission("pipeline:read") })
  .get("/deals", async ({ query, user }) => {
    const stageId = (query as any).stageId;
    const conditions = [];
    if (stageId) conditions.push(eq(deals.stageId, stageId));
    if (user.role === "agent") {
      conditions.push(eq(deals.userId, user.id));
    } else if (user.role === "manager") {
      if (!user.territoryId) return { success: true, data: [] };
      const territoryLeadIds = db.select({ id: leads.id }).from(leads).where(eq(leads.territoryId, user.territoryId)).all().map((l) => l.id);
      conditions.push(territoryLeadIds.length > 0 ? inArray(deals.leadId, territoryLeadIds) : sql`1=0`);
    }
    let q = db.select().from(deals).$dynamic();
    if (conditions.length) q = q.where(and(...conditions));
    return { success: true, data: q.all() };
  }, { beforeHandle: requirePermission("pipeline:read") })
  .post("/deals", async ({ body, user }) => {
    const id = crypto.randomUUID();
    db.insert(deals).values({ id, ...(body as any), userId: user.id }).run();
    return { success: true, data: db.select().from(deals).where(eq(deals.id, id)).get() };
  }, { beforeHandle: requirePermission("pipeline:write") })
  .patch("/deals/:id", async ({ params, body }) => {
    db.update(deals).set({ ...(body as any), updatedAt: new Date() }).where(eq(deals.id, params.id)).run();
    return { success: true, data: db.select().from(deals).where(eq(deals.id, params.id)).get() };
  }, { beforeHandle: [requirePermission("pipeline:write"), dealOwnership] });
