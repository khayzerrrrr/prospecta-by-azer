import { pgTable, text, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { users } from "./users";

export const payrollRuns = pgTable("payroll_runs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id),
  periodMonth: integer("period_month").notNull(),
  periodYear: integer("period_year").notNull(),
  status: text("status", { enum: ["draft", "finalized", "paid"] }).notNull().default("draft"),
  createdBy: text("created_by").notNull().references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  unique("payroll_run_period_unique").on(table.companyId, table.periodMonth, table.periodYear),
]);
