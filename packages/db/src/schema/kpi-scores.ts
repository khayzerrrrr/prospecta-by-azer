import { pgTable, text, timestamp, integer, real, unique } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { users } from "./users";
import { employeeProfiles } from "./employee-profiles";
import { kpiDefinitions } from "./kpi-definitions";

export const kpiScores = pgTable("kpi_scores", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id),
  employeeProfileId: text("employee_profile_id").notNull().references(() => employeeProfiles.id, { onDelete: "cascade" }),
  kpiDefinitionId: text("kpi_definition_id").notNull().references(() => kpiDefinitions.id, { onDelete: "cascade" }),
  periodMonth: integer("period_month").notNull(),
  periodYear: integer("period_year").notNull(),
  // Snapshot of the definition's target at scoring time, so later edits to
  // kpi_definitions don't retroactively change past scores.
  targetValue: integer("target_value").notNull().default(0),
  actualValue: integer("actual_value").notNull().default(0),
  achievementPercent: real("achievement_percent").notNull().default(0),
  notes: text("notes"),
  scoredBy: text("scored_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  unique("kpi_score_employee_period_unique").on(table.employeeProfileId, table.kpiDefinitionId, table.periodMonth, table.periodYear),
]);
