import { Elysia, t } from "elysia";
import { db, leads } from "@visitflow/db";
import { eq } from "drizzle-orm";
import { leadService } from "../services/lead.service";
import { getAuthUser } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { ownershipGuard } from "../middleware/ownership";
import { UnauthorizedError } from "../utils/errors";

const leadOwnership = ownershipGuard(async (id: string) => {
  const [lead] = await db.select().from(leads).where(eq(leads.id, id));
  if (!lead) return undefined;
  return { ownerId: lead.assignedTo, territoryId: lead.territoryId, companyId: lead.companyId };
});

export const leadRoutes = new Elysia({ prefix: "/leads" })
  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    if (!user) throw new UnauthorizedError();
    return { user };
  })
  .get("/", async ({ query, user }) => {
    const result = await leadService.list(query, user);
    return { success: true, ...result };
  }, { beforeHandle: requirePermission("leads:read") })
  .get("/:id", async ({ params }) => {
    const lead = await leadService.getById(params.id);
    return { success: true, data: lead };
  }, { beforeHandle: [requirePermission("leads:read"), leadOwnership] })
  .post("/", async ({ body, user }) => {
    const lead = await leadService.create(body, user);
    return { success: true, data: lead };
  }, { beforeHandle: requirePermission("leads:write") })
  .patch("/:id", async ({ params, body }) => {
    const lead = await leadService.update(params.id, body);
    return { success: true, data: lead };
  }, { beforeHandle: [requirePermission("leads:write"), leadOwnership] })
  .delete("/:id", async ({ params }) => {
    await leadService.delete(params.id);
    return { success: true };
  }, { beforeHandle: [requirePermission("leads:write"), leadOwnership] });
