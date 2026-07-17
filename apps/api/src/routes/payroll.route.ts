import { Elysia, t } from "elysia";
import { payrollService } from "../services/payroll.service";
import { getAuthUser } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";

function requireHr(user: any) {
  if (user.role !== "admin" && user.role !== "super_admin") throw new ForbiddenError("Hanya HR/admin yang bisa mengelola payroll");
}

export const payrollRoutes = new Elysia({ prefix: "/payroll" })
  .derive(async ({ request, cookie }) => {
    const user = await getAuthUser(request, cookie).catch(() => null);
    if (!user) throw new UnauthorizedError();
    return { user };
  })
  // Salary components (HR-managed)
  .get("/components", async ({ user }) => {
    const data = await payrollService.listComponents(user.companyId!);
    return { success: true, data };
  }, { beforeHandle: requirePermission("payroll:read") })
  .post("/components", async ({ body, user }) => {
    requireHr(user);
    const data = await payrollService.createComponent(user.companyId!, body);
    return { success: true, data };
  }, {
    beforeHandle: requirePermission("payroll:write"),
    body: t.Object({
      name: t.String(), type: t.Union([t.Literal("allowance"), t.Literal("deduction"), t.Literal("bonus"), t.Literal("incentive")]),
      amountType: t.Optional(t.Union([t.Literal("fixed"), t.Literal("percentage_of_base")])),
      defaultAmount: t.Optional(t.Number()), taxable: t.Optional(t.Boolean()),
    }),
  })
  .patch("/components/:id", async ({ params, body, user }) => {
    requireHr(user);
    const data = await payrollService.updateComponent(params.id, body);
    return { success: true, data };
  }, { beforeHandle: requirePermission("payroll:write") })

  // Employee <-> component assignment
  .get("/employees/:employeeProfileId/components", async ({ params, user }) => {
    const data = await payrollService.listEmployeeComponents(params.employeeProfileId);
    return { success: true, data };
  }, { beforeHandle: requirePermission("payroll:read") })
  .post("/employees/:employeeProfileId/components", async ({ params, body, user }) => {
    requireHr(user);
    const id = await payrollService.assignComponent(params.employeeProfileId, body.componentId, body.amountOverride ?? null);
    return { success: true, data: { id } };
  }, {
    beforeHandle: requirePermission("payroll:write"),
    body: t.Object({ componentId: t.String(), amountOverride: t.Optional(t.Number()) }),
  })
  .delete("/employees/:employeeProfileId/components/:componentId", async ({ params, user }) => {
    requireHr(user);
    await payrollService.unassignComponent(params.employeeProfileId, params.componentId);
    return { success: true };
  }, { beforeHandle: requirePermission("payroll:write") })

  // Payroll runs
  .get("/runs", async ({ user }) => {
    requireHr(user);
    const data = await payrollService.listRuns(user.companyId!);
    return { success: true, data };
  }, { beforeHandle: requirePermission("payroll:read") })
  .post("/runs", async ({ body, user }) => {
    requireHr(user);
    try {
      const data = await payrollService.createRun(user.companyId!, user.id, body.periodMonth, body.periodYear, body.notes || null);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }, {
    beforeHandle: requirePermission("payroll:write"),
    body: t.Object({ periodMonth: t.Number(), periodYear: t.Number(), notes: t.Optional(t.String()) }),
  })
  .get("/runs/:id", async ({ params, user }) => {
    requireHr(user);
    const data = await payrollService.getRun(params.id);
    return { success: true, data };
  }, { beforeHandle: requirePermission("payroll:read") })
  .post("/runs/:id/finalize", async ({ params, user }) => {
    requireHr(user);
    const data = await payrollService.finalizeRun(params.id);
    return { success: true, data };
  }, { beforeHandle: requirePermission("payroll:write") })
  .post("/runs/:id/pay", async ({ params, user }) => {
    requireHr(user);
    const data = await payrollService.markRunPaid(params.id);
    return { success: true, data };
  }, { beforeHandle: requirePermission("payroll:write") })

  // Payslips
  .get("/payslips/me", async ({ user }) => {
    const data = await payrollService.listMyPayslips(user.id);
    return { success: true, data };
  }, { beforeHandle: requirePermission("payroll:read") })
  .get("/payslips/:id", async ({ params, user }) => {
    const data = await payrollService.getPayslip(params.id);
    if (user.role !== "admin" && user.role !== "super_admin" && data.userId !== user.id) {
      throw new ForbiddenError();
    }
    return { success: true, data };
  }, { beforeHandle: requirePermission("payroll:read") });
