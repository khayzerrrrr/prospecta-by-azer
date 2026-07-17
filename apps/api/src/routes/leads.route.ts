import { Elysia, t } from "elysia";
import { db, leads } from "@visitflow/db";
import { eq } from "drizzle-orm";
import { leadService } from "../services/lead.service";
import { getAuthUser } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { ownershipGuard } from "../middleware/ownership";
import { UnauthorizedError } from "../utils/errors";

const leadOwnership = ownershipGuard((id: string) => {
  const lead = db.select().from(leads).where(eq(leads.id, id)).get();
  if (!lead) return undefined;
  return { ownerId: lead.assignedTo, territoryId: lead.territoryId };
});

export const leadRoutes = new Elysia({ prefix: "/leads" })
  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    if (!user) throw new UnauthorizedError();
    return { user };
  })
  .get("/", async ({ query, user }) => {
    const result = leadService.list(query, user);
    return { success: true, ...result };
  }, { beforeHandle: requirePermission("leads:read") })
  .get("/:id", async ({ params }) => {
    const lead = leadService.getById(params.id);
    return { success: true, data: lead };
  }, { beforeHandle: [requirePermission("leads:read"), leadOwnership] })
  .post("/", async ({ body, user }) => {
    const lead = leadService.create(body, user);
    return { success: true, data: lead };
  }, { beforeHandle: requirePermission("leads:write") })
  .patch("/:id", async ({ params, body }) => {
    const lead = leadService.update(params.id, body);
    return { success: true, data: lead };
  }, { beforeHandle: [requirePermission("leads:write"), leadOwnership] })
  .delete("/:id", async ({ params }) => {
    leadService.delete(params.id);
    return { success: true };
  }, { beforeHandle: [requirePermission("leads:write"), leadOwnership] });
