import { Elysia, t } from "elysia";
import { companyService } from "../services/company.service";
import { getAuthUser } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { UnauthorizedError } from "../utils/errors";

export const companyRoutes = new Elysia({ prefix: "/companies" })
  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    if (!user) throw new UnauthorizedError();
    return { user };
  })
  .get("/", async () => {
    const data = await companyService.list();
    return { success: true, data };
  }, { beforeHandle: requirePermission("companies:read") })
  .post("/", async ({ body }) => {
    try {
      const data = await companyService.create(body);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }, {
    beforeHandle: requirePermission("companies:write"),
    body: t.Object({
      name: t.String({ minLength: 2 }),
      industry: t.Optional(t.String()),
      subscriptionStatus: t.Optional(t.Union([t.Literal("trial"), t.Literal("active"), t.Literal("suspended"), t.Literal("cancelled")])),
    }),
  })
  .patch("/:id", async ({ params, body }) => {
    try {
      const data = await companyService.update(params.id, body);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }, {
    beforeHandle: requirePermission("companies:write"),
    body: t.Object({
      industry: t.Optional(t.Union([t.String(), t.Null()])),
      subscriptionStatus: t.Optional(t.Union([t.Literal("trial"), t.Literal("active"), t.Literal("suspended"), t.Literal("cancelled")])),
      isActive: t.Optional(t.Boolean()),
    }),
  })
  .post("/:id/regenerate-code", async ({ params }) => {
    const data = await companyService.regenerateCode(params.id);
    return { success: true, data };
  }, { beforeHandle: requirePermission("companies:write") });
