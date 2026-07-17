import { pgTable, text, timestamp, integer, jsonb, unique } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { users } from "./users";
import { employeeProfiles } from "./employee-profiles";
import { payrollRuns } from "./payroll-runs";

export const payslips = pgTable("payslips", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  payrollRunId: text("payroll_run_id").notNull().references(() => payrollRuns.id, { onDelete: "cascade" }),
  companyId: text("company_id").notNull().references(() => companies.id),
  employeeProfileId: text("employee_profile_id").notNull().references(() => employeeProfiles.id),
  userId: text("user_id").notNull().references(() => users.id),

  baseSalary: integer("base_salary").notNull().default(0),
  totalAllowance: integer("total_allowance").notNull().default(0),
  totalDeduction: integer("total_deduction").notNull().default(0),
  totalBonus: integer("total_bonus").notNull().default(0),
  totalIncentive: integer("total_incentive").notNull().default(0),

  bpjsKesehatanEmployee: integer("bpjs_kesehatan_employee").notNull().default(0),
  bpjsKesehatanEmployer: integer("bpjs_kesehatan_employer").notNull().default(0),
  bpjsKetenagakerjaanEmployee: integer("bpjs_ketenagakerjaan_employee").notNull().default(0),
  bpjsKetenagakerjaanEmployer: integer("bpjs_ketenagakerjaan_employer").notNull().default(0),

  grossPay: integer("gross_pay").notNull().default(0),
  pph21: integer("pph21").notNull().default(0),
  netPay: integer("net_pay").notNull().default(0),

  daysPresent: integer("days_present").notNull().default(0),
  daysAbsent: integer("days_absent").notNull().default(0),
  daysLate: integer("days_late").notNull().default(0),

  // Snapshot of every component applied to this payslip, for audit purposes —
  // so later edits to salary_components don't retroactively change past payslips.
  componentsBreakdown: jsonb("components_breakdown").$type<Array<{ name: string; type: string; amount: number }>>().default([]),

  status: text("status", { enum: ["draft", "finalized", "paid"] }).notNull().default("draft"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  unique("payslip_run_employee_unique").on(table.payrollRunId, table.employeeProfileId),
]);
