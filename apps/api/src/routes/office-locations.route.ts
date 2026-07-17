import { Elysia, t } from "elysia";
import { db, officeLocations } from "@visitflow/db";
import { eq } from "drizzle-orm";
import { officeLocationService } from "../services/office-location.service";
import { getAuthUser } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { ownershipGuard } from "../middleware/ownership";
import { UnauthorizedError } from "../utils/errors";

const officeLocationOwnership = ownershipGuard(async (id: string) => {
  const [row] = await db.select().from(officeLocations).where(eq(officeLocations.id, id));
  if (!row) return undefined;
  return { companyId: row.companyId };
});

export const officeLocationRoutes = new Elysia({ prefix: "/office-locations" })
  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    if (!user) throw new UnauthorizedError();
    return { user };
  })
  .get("/", async ({ user }) => {
    const data = await officeLocationService.list(user.companyId!);
    return { success: true, data };
  }, { beforeHandle: requirePermission("office-locations:read") })
  .post("/", async ({ body, user }) => {
    const data = await officeLocationService.create(body, user.companyId!);
    return { success: true, data };
  }, {
    beforeHandle: requirePermission("office-locations:write"),
    body: t.Object({ name: t.String(), address: t.Optional(t.String()), latitude: t.Number(), longitude: t.Number(), radiusMeters: t.Optional(t.Number()) }),
  })
  .patch("/:id", async ({ params, body }) => {
    const data = await officeLocationService.update(params.id, body);
    return { success: true, data };
  }, { beforeHandle: [requirePermission("office-locations:write"), officeLocationOwnership] });
