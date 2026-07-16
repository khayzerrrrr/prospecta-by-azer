import { Elysia, t } from "elysia";
import { leadService } from "../services/lead.service";
import { getAuthUser } from "../middleware/auth";

export const leadRoutes = new Elysia({ prefix: "/leads" })
  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    if (!user) throw new Error("Unauthorized");
    return { user };
  })
  .get("/", async ({ query, user }) => {
    const result = leadService.list(query, user);
    return { success: true, ...result };
  })
  .get("/:id", async ({ params }) => {
    const lead = leadService.getById(params.id);
    return { success: true, data: lead };
  })
  .post("/", async ({ body, user }) => {
    const lead = leadService.create(body, user);
    return { success: true, data: lead };
  })
  .patch("/:id", async ({ params, body }) => {
    const lead = leadService.update(params.id, body);
    return { success: true, data: lead };
  })
  .delete("/:id", async ({ params }) => {
    leadService.delete(params.id);
    return { success: true };
  });
