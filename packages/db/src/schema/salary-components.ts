import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { companies } from "./companies";

// HR-defined, general-purpose salary line items (allowance/deduction/bonus/incentive) —
// not tied to any specific role, per requirement to support both field and office staff.
export const salaryComponents = pgTable("salary_components", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["allowance", "deduction", "bonus", "incentive"] }).notNull(),
  amountType: text("amount_type", { enum: ["fixed", "percentage_of_base"] }).notNull().default("fixed"),
  defaultAmount: integer("default_amount").notNull().default(0),
  // Whether this component counts toward PPh21 taxable income (most allowances/bonuses
  // do; some reimbursement-style items don't — HR decides per component).
  taxable: boolean("taxable").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
