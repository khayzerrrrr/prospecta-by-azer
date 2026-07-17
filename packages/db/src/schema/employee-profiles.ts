import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { users } from "./users";

export const employeeProfiles = pgTable("employee_profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  employeeType: text("employee_type", { enum: ["office", "field"] }).notNull().default("field"),
  employmentStatus: text("employment_status", { enum: ["active", "resigned", "terminated"] }).notNull().default("active"),
  baseSalary: integer("base_salary").default(0),
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankAccountName: text("bank_account_name"),
  // PTKP category for PPh21 (e.g. TK/0, K/0, K/1, K/2, K/3) — verify current
  // brackets with an accountant before relying on this for real payroll.
  taxStatus: text("tax_status").default("TK/0"),
  npwp: text("npwp"),
  bpjsKesehatanEnrolled: boolean("bpjs_kesehatan_enrolled").notNull().default(false),
  bpjsKetenagakerjaanEnrolled: boolean("bpjs_ketenagakerjaan_enrolled").notNull().default(false),
  joinDate: text("join_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
