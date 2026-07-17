import { pgTable, text, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { employeeProfiles } from "./employee-profiles";
import { salaryComponents } from "./salary-components";

// Assigns a salary component to a specific employee, optionally overriding the
// component's default amount (e.g. a per-employee transport allowance).
export const employeeSalaryComponents = pgTable("employee_salary_components", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  employeeProfileId: text("employee_profile_id").notNull().references(() => employeeProfiles.id, { onDelete: "cascade" }),
  componentId: text("component_id").notNull().references(() => salaryComponents.id, { onDelete: "cascade" }),
  amountOverride: integer("amount_override"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  unique("emp_salary_component_unique").on(table.employeeProfileId, table.componentId),
]);
