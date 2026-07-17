import { Elysia, t } from "elysia";
import { db, employeeProfiles, users } from "@visitflow/db";
import { eq } from "drizzle-orm";
import { employeeService } from "../services/employee.service";
import { getAuthUser } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { ownershipGuard } from "../middleware/ownership";
import { UnauthorizedError } from "../utils/errors";

const employeeOwnership = ownershipGuard(async (id: string) => {
  const [profile] = await db.select().from(employeeProfiles).where(eq(employeeProfiles.id, id));
  if (!profile) return undefined;
  const [target] = await db.select({ territoryId: users.territoryId }).from(users).where(eq(users.id, profile.userId));
  return { companyId: profile.companyId, territoryId: target?.territoryId ?? null };
});

export const employeeRoutes = new Elysia({ prefix: "/employees" })
  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    if (!user) throw new UnauthorizedError();
    return { user };
  })
  .get("/me", async ({ user }) => {
    const profile = await employeeService.getByUserId(user.id);
    return { success: true, data: profile };
  })
  .get("/", async ({ user }) => {
    const data = await employeeService.list(user);
    return { success: true, data };
  }, { beforeHandle: requirePermission("employees:read") })
  .get("/:id", async ({ params }) => {
    const data = await employeeService.getById(params.id);
    return { success: true, data };
  }, { beforeHandle: [requirePermission("employees:read"), employeeOwnership] })
  .post("/", async ({ body, user }) => {
    const data = await employeeService.create(body, user.companyId!);
    return { success: true, data };
  }, {
    beforeHandle: requirePermission("employees:write"),
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 6 }),
      fullName: t.String({ minLength: 2 }),
      phone: t.Optional(t.String()),
      role: t.Optional(t.String()),
      territoryId: t.Optional(t.String()),
      employeeType: t.Optional(t.String()),
      baseSalary: t.Optional(t.Number()),
      bankName: t.Optional(t.String()),
      bankAccountNumber: t.Optional(t.String()),
      bankAccountName: t.Optional(t.String()),
      taxStatus: t.Optional(t.String()),
      npwp: t.Optional(t.String()),
      bpjsKesehatanEnrolled: t.Optional(t.Boolean()),
      bpjsKetenagakerjaanEnrolled: t.Optional(t.Boolean()),
      joinDate: t.Optional(t.String()),
      avatarUrl: t.Optional(t.String()),
    }),
  })
  .patch("/:id", async ({ params, body }) => {
    const data = await employeeService.update(params.id, body);
    return { success: true, data };
  }, { beforeHandle: [requirePermission("employees:write"), employeeOwnership] });
