import { Elysia, t } from "elysia";
import { authService } from "../services/auth.service";
import { companyService } from "../services/company.service";
import { getAuthUser } from "../middleware/auth";
import { resolveTenant } from "../middleware/tenant";

export const authRoutes = new Elysia({ prefix: "/auth" })
  // Public, pre-tenant-resolution — the company is looked up by name + claim
  // code here, not by subdomain, since the company self-registering its one
  // super_admin account hasn't picked a subdomain yet.
  .post("/claim-company", async ({ body }) => {
    try {
      const result = await companyService.claimCompany(body);
      return { success: true, data: result };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }, {
    body: t.Object({
      companyName: t.String({ minLength: 1 }),
      claimCode: t.String({ minLength: 1 }),
      fullName: t.String({ minLength: 2 }),
      jobTitle: t.Optional(t.String()),
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 6 }),
    }),
  })
  .derive(resolveTenant)
  .post("/register", async ({ body, company }) => {
    try {
      const result = await authService.register(body, company.id);
      return { success: true, data: result };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }, {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 6 }),
      fullName: t.String({ minLength: 2 }),
      phone: t.Optional(t.String()),
    }),
  })

  .post("/login", async ({ body, set, cookie, company }) => {
    try {
      const result = await authService.login(body, company.id);
      cookie.access_token?.set({
        value: result.tokens.accessToken, httpOnly: true, secure: true,
        sameSite: "lax", path: "/", maxAge: 900,
      });
      return { success: true, data: result };
    } catch (e: any) {
      set.status = 401;
      return { success: false, error: e.message };
    }
  }, {
    body: t.Object({ email: t.String({ format: "email" }), password: t.String() }),
  })

  .post("/refresh", async ({ body }) => {
    try {
      const tokens = await authService.refresh(body.refreshToken);
      return { success: true, data: tokens };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }, {
    body: t.Object({ refreshToken: t.String() }),
  })

  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    return { user };
  })
  .get("/me", async ({ user }) => {
    if (!user) return { success: false, error: "Unauthorized" };
    const result = await authService.me(user.id);
    return { success: true, data: result };
  })
  .patch("/me/photo", async ({ user, body }) => {
    if (!user) return { success: false, error: "Unauthorized" };
    const result = await authService.updatePhoto(user.id, body.photo);
    return { success: true, data: result };
  }, {
    body: t.Object({ photo: t.String() }),
  });
