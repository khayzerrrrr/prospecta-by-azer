import { Elysia, t } from "elysia";
import { db, visits, leads } from "@visitflow/db";
import { eq } from "drizzle-orm";
import { visitService } from "../services/visit.service";
import { getAuthUser } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { ownershipGuard } from "../middleware/ownership";
import { UnauthorizedError } from "../utils/errors";

const visitOwnership = ownershipGuard((id: string) => {
  const visit = db.select().from(visits).where(eq(visits.id, id)).get();
  if (!visit) return undefined;
  const lead = db.select().from(leads).where(eq(leads.id, visit.leadId)).get();
  return { ownerId: visit.userId, territoryId: lead?.territoryId ?? null };
});

export const visitRoutes = new Elysia({ prefix: "/visits" })
  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    if (!user) throw new UnauthorizedError();
    return { user };
  })
  .get("/", async ({ query, user }) => visitService.list(query, user), { beforeHandle: requirePermission("visits:read") })
  .get("/:id", async ({ params }) => {
    const data = visitService.getById(params.id);
    return { success: true, data };
  }, { beforeHandle: [requirePermission("visits:read"), visitOwnership] })
  .post("/", async ({ body, user }) => {
    const data = visitService.create(body, user);
    return { success: true, data };
  }, {
    beforeHandle: requirePermission("visits:write"),
    body: t.Object({ leadId: t.String(), title: t.String(), description: t.Optional(t.String()), visitType: t.Optional(t.String()), scheduledDate: t.String(), scheduledStartTime: t.Optional(t.String()) }),
  })
  .post("/:id/checkin", async ({ params, body, user }) => {
    const data = visitService.checkin(params.id, body, user);
    return { success: true, data };
  }, {
    beforeHandle: [requirePermission("visits:checkin"), visitOwnership],
    body: t.Object({ latitude: t.Number(), longitude: t.Number() }),
  })
  .post("/:id/checkout", async ({ params, body, user }) => {
    const data = visitService.checkout(params.id, body, body.meetingNotes || null, body.nextSteps || null, user);
    return { success: true, data };
  }, {
    beforeHandle: [requirePermission("visits:checkin"), visitOwnership],
    body: t.Object({ latitude: t.Number(), longitude: t.Number(), meetingNotes: t.Optional(t.String()), nextSteps: t.Optional(t.String()) }),
  });
