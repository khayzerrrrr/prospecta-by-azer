import { Elysia, t } from "elysia";
import { authService } from "../services/auth.service";
import { getAuthUser } from "../middleware/auth";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .post("/register", async ({ body }) => {
    try {
      const result = await authService.register(body);
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

  .post("/login", async ({ body, set, cookie }) => {
    try {
      const result = await authService.login(body);
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
  });
