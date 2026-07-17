import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { companies } from "./companies";

// General-purpose KPI definitions — deliberately not marketing/sales-specific,
// since both field and office staff use this. HR free-types the unit
// (e.g. "kunjungan", "unit terjual", "proyek selesai", "jam lembur").
export const kpiDefinitions = pgTable("kpi_definitions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  unit: text("unit").notNull(),
  targetValue: integer("target_value").notNull().default(0),
  // Relative importance when combining multiple KPIs into one overall score
  // for an employee — not required to sum to 100 across a company's KPIs.
  weight: integer("weight").notNull().default(100),
  appliesTo: text("applies_to", { enum: ["all", "office", "field"] }).notNull().default("all"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
