import {
  db, salaryComponents, employeeSalaryComponents, payrollRuns, payslips,
  employeeProfiles, users, attendance,
} from "@visitflow/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { calculatePPh21Monthly, calculateBpjsKesehatan, calculateBpjsKetenagakerjaan, type TaxStatus } from "../utils/payroll-calc";

class PayrollService {
  // ---- Salary components (HR-defined line items) ----
  async listComponents(companyId: string) {
    return db.select().from(salaryComponents).where(eq(salaryComponents.companyId, companyId));
  }

  async createComponent(companyId: string, data: any) {
    const [row] = await db.insert(salaryComponents).values({
      companyId, name: data.name, type: data.type,
      amountType: data.amountType || "fixed",
      defaultAmount: data.defaultAmount || 0,
      taxable: data.taxable !== undefined ? !!data.taxable : true,
    }).returning();
    return row;
  }

  async updateComponent(id: string, data: any) {
    const fields: any = {};
    for (const key of ["name", "type", "amountType", "defaultAmount", "taxable", "isActive"]) {
      if (data[key] !== undefined) fields[key] = data[key];
    }
    await db.update(salaryComponents).set({ ...fields, updatedAt: new Date() }).where(eq(salaryComponents.id, id));
    const [row] = await db.select().from(salaryComponents).where(eq(salaryComponents.id, id));
    return row;
  }

  // ---- Assigning components to a specific employee ----
  async listEmployeeComponents(employeeProfileId: string) {
    const rows = await db.select({
      assignment: employeeSalaryComponents,
      component: salaryComponents,
    }).from(employeeSalaryComponents)
      .innerJoin(salaryComponents, eq(employeeSalaryComponents.componentId, salaryComponents.id))
      .where(eq(employeeSalaryComponents.employeeProfileId, employeeProfileId));
    return rows.map((r) => ({ ...r.assignment, component: r.component }));
  }

  async assignComponent(employeeProfileId: string, componentId: string, amountOverride: number | null) {
    const [existing] = await db.select().from(employeeSalaryComponents)
      .where(and(eq(employeeSalaryComponents.employeeProfileId, employeeProfileId), eq(employeeSalaryComponents.componentId, componentId)));
    if (existing) {
      await db.update(employeeSalaryComponents).set({ amountOverride }).where(eq(employeeSalaryComponents.id, existing.id));
      return existing.id;
    }
    const [row] = await db.insert(employeeSalaryComponents).values({ employeeProfileId, componentId, amountOverride }).returning();
    return row!.id;
  }

  async unassignComponent(employeeProfileId: string, componentId: string) {
    await db.delete(employeeSalaryComponents)
      .where(and(eq(employeeSalaryComponents.employeeProfileId, employeeProfileId), eq(employeeSalaryComponents.componentId, componentId)));
  }

  // ---- Payroll runs ----
  async listRuns(companyId: string) {
    return db.select().from(payrollRuns).where(eq(payrollRuns.companyId, companyId));
  }

  async getRun(id: string) {
    const [run] = await db.select().from(payrollRuns).where(eq(payrollRuns.id, id));
    if (!run) throw new Error("Payroll run not found");
    const runPayslips = await db.select({
      payslip: payslips,
      user: { id: users.id, fullName: users.fullName, email: users.email, avatarUrl: users.avatarUrl },
    }).from(payslips)
      .innerJoin(users, eq(payslips.userId, users.id))
      .where(eq(payslips.payrollRunId, id));
    return { ...run, payslips: runPayslips.map((r) => ({ ...r.payslip, user: r.user })) };
  }

  // Creates a payroll run for a period and generates draft payslips for every
  // active employee in the company, computed from their base salary, assigned
  // components, attendance for the period, and BPJS/PPh21 calculations.
  async createRun(companyId: string, createdBy: string, periodMonth: number, periodYear: number, notes: string | null) {
    const [existing] = await db.select().from(payrollRuns)
      .where(and(eq(payrollRuns.companyId, companyId), eq(payrollRuns.periodMonth, periodMonth), eq(payrollRuns.periodYear, periodYear)));
    if (existing) throw new Error("Payroll run untuk periode ini sudah ada");

    const [run] = await db.insert(payrollRuns).values({ companyId, periodMonth, periodYear, createdBy, notes }).returning();

    const employees = await db.select({
      profile: employeeProfiles,
      user: { id: users.id, fullName: users.fullName, isActive: users.isActive },
    }).from(employeeProfiles)
      .innerJoin(users, eq(employeeProfiles.userId, users.id))
      .where(and(eq(employeeProfiles.companyId, companyId), eq(employeeProfiles.employmentStatus, "active")));

    const periodStart = `${periodYear}-${String(periodMonth).padStart(2, "0")}-01`;
    const periodEndDate = new Date(periodYear, periodMonth, 0);
    const periodEnd = periodEndDate.toISOString().slice(0, 10);

    for (const { profile, user } of employees) {
      if (!user.isActive) continue;

      const assignments = await this.listEmployeeComponents(profile.id);
      let totalAllowance = 0, totalDeduction = 0, totalBonus = 0, totalIncentive = 0, taxableComponents = 0;
      const breakdown: Array<{ name: string; type: string; amount: number }> = [];

      for (const a of assignments) {
        if (!a.component.isActive) continue;
        const amount = a.amountOverride ?? (
          a.component.amountType === "percentage_of_base"
            ? Math.round((profile.baseSalary || 0) * (a.component.defaultAmount / 100))
            : a.component.defaultAmount
        );
        breakdown.push({ name: a.component.name, type: a.component.type, amount });
        if (a.component.type === "allowance") totalAllowance += amount;
        else if (a.component.type === "deduction") totalDeduction += amount;
        else if (a.component.type === "bonus") totalBonus += amount;
        else if (a.component.type === "incentive") totalIncentive += amount;
        if (a.component.taxable && a.component.type !== "deduction") taxableComponents += amount;
      }

      const baseSalary = profile.baseSalary || 0;
      const bpjsKesehatan = calculateBpjsKesehatan(baseSalary, profile.bpjsKesehatanEnrolled);
      const bpjsKetenagakerjaan = calculateBpjsKetenagakerjaan(baseSalary, profile.bpjsKetenagakerjaanEnrolled);

      // Employee-paid BPJS premiums reduce PPh21-taxable income (per PP 55/2022).
      const taxableIncome = baseSalary + taxableComponents - bpjsKesehatan.employee - bpjsKetenagakerjaan.employee;
      const pph21 = calculatePPh21Monthly(taxableIncome, (profile.taxStatus as TaxStatus) || "TK/0");

      const grossPay = baseSalary + totalAllowance + totalBonus + totalIncentive;
      const netPay = grossPay - totalDeduction - bpjsKesehatan.employee - bpjsKetenagakerjaan.employee - pph21;

      const attendanceRows = await db.select().from(attendance)
        .where(and(eq(attendance.userId, user.id), gte(attendance.date, periodStart), lte(attendance.date, periodEnd)));
      const daysPresent = attendanceRows.filter((r) => r.status === "present").length;
      const daysLate = attendanceRows.filter((r) => r.status === "late").length;
      const daysAbsent = attendanceRows.filter((r) => r.status === "absent").length;

      await db.insert(payslips).values({
        payrollRunId: run!.id, companyId, employeeProfileId: profile.id, userId: user.id,
        baseSalary, totalAllowance, totalDeduction, totalBonus, totalIncentive,
        bpjsKesehatanEmployee: bpjsKesehatan.employee, bpjsKesehatanEmployer: bpjsKesehatan.employer,
        bpjsKetenagakerjaanEmployee: bpjsKetenagakerjaan.employee, bpjsKetenagakerjaanEmployer: bpjsKetenagakerjaan.employer,
        grossPay, pph21, netPay,
        daysPresent, daysAbsent, daysLate,
        componentsBreakdown: breakdown,
      });
    }

    return this.getRun(run!.id);
  }

  async finalizeRun(id: string) {
    await db.update(payrollRuns).set({ status: "finalized", updatedAt: new Date() }).where(eq(payrollRuns.id, id));
    await db.update(payslips).set({ status: "finalized", updatedAt: new Date() }).where(eq(payslips.payrollRunId, id));
    return this.getRun(id);
  }

  async markRunPaid(id: string) {
    const now = new Date();
    await db.update(payrollRuns).set({ status: "paid", updatedAt: now }).where(eq(payrollRuns.id, id));
    await db.update(payslips).set({ status: "paid", paidAt: now, updatedAt: now }).where(eq(payslips.payrollRunId, id));
    return this.getRun(id);
  }

  // ---- Payslips ----
  async getPayslip(id: string) {
    const [row] = await db.select({
      payslip: payslips,
      user: { id: users.id, fullName: users.fullName, email: users.email, avatarUrl: users.avatarUrl },
      run: { periodMonth: payrollRuns.periodMonth, periodYear: payrollRuns.periodYear },
    }).from(payslips)
      .innerJoin(users, eq(payslips.userId, users.id))
      .innerJoin(payrollRuns, eq(payslips.payrollRunId, payrollRuns.id))
      .where(eq(payslips.id, id));
    if (!row) throw new Error("Payslip not found");
    return { ...row.payslip, user: row.user, run: row.run };
  }

  async listMyPayslips(userId: string) {
    const rows = await db.select({
      payslip: payslips,
      run: { periodMonth: payrollRuns.periodMonth, periodYear: payrollRuns.periodYear, status: payrollRuns.status },
    }).from(payslips)
      .innerJoin(payrollRuns, eq(payslips.payrollRunId, payrollRuns.id))
      .where(eq(payslips.userId, userId));
    return rows.map((r) => ({ ...r.payslip, run: r.run }));
  }
}

export const payrollService = new PayrollService();
