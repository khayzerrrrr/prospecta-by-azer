import { Elysia, t } from "elysia";
import { visitService } from "../services/visit.service";
import { getAuthUser } from "../middleware/auth";

export const visitRoutes = new Elysia({ prefix: "/visits" })
  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    if (!user) throw new Error("Unauthorized");
    return { user };
  })
  .get("/", async ({ query, user }) => visitService.list(query, user))
  .get("/:id", async ({ params }) => {
    const data = visitService.getById(params.id);
    return { success: true, data };
  })
  .post("/", async ({ body, user }) => {
    const data = visitService.create(body, user);
    return { success: true, data };
  }, {
    body: t.Object({ leadId: t.String(), title: t.String(), description: t.Optional(t.String()), visitType: t.Optional(t.String()), scheduledDate: t.String(), scheduledStartTime: t.Optional(t.String()) }),
  })
  .post("/:id/checkin", async ({ params, body, user }) => {
    const data = visitService.checkin(params.id, body, user);
    return { success: true, data };
  }, { body: t.Object({ latitude: t.Number(), longitude: t.Number() }) })
  .post("/:id/checkout", async ({ params, body, user }) => {
    const data = visitService.checkout(params.id, body, body.meetingNotes || null, body.nextSteps || null, user);
    return { success: true, data };
  }, { body: t.Object({ latitude: t.Number(), longitude: t.Number(), meetingNotes: t.Optional(t.String()), nextSteps: t.Optional(t.String()) }) });
