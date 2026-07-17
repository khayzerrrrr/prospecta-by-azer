import { Elysia, t } from "elysia";
import { attendanceService } from "../services/attendance.service";
import { getAuthUser } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { UnauthorizedError } from "../utils/errors";

export const attendanceRoutes = new Elysia({ prefix: "/attendance" })
  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    if (!user) throw new UnauthorizedError();
    return { user };
  })
  .get("/today", async ({ user }) => {
    const data = await attendanceService.getToday(user.id);
    return { success: true, data };
  }, { beforeHandle: requirePermission("attendance:read") })
  .get("/", async ({ query, user }) => {
    const data = await attendanceService.list(query, user);
    return { success: true, data };
  }, { beforeHandle: requirePermission("attendance:read") })
  .post("/checkin", async ({ body, user }) => {
    try {
      const data = await attendanceService.checkin(user, { latitude: body.latitude, longitude: body.longitude }, body.photo || null);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }, {
    beforeHandle: requirePermission("attendance:checkin"),
    body: t.Object({ latitude: t.Number(), longitude: t.Number(), photo: t.Optional(t.String()) }),
  })
  .post("/checkout", async ({ body, user }) => {
    try {
      const data = await attendanceService.checkout(user, { latitude: body.latitude, longitude: body.longitude }, body.photo || null);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }, {
    beforeHandle: requirePermission("attendance:checkin"),
    body: t.Object({ latitude: t.Number(), longitude: t.Number(), photo: t.Optional(t.String()) }),
  });
