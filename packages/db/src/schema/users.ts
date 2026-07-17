import { pgTable, text, timestamp, boolean, integer, unique } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { territories } from "./territories";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  // Nullable only for role=master_account, which sits outside any single
  // tenant. Every other role must have a companyId — enforced in app code.
  companyId: text("company_id").references(() => companies.id),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  role: text("role", { enum: ["master_account", "super_admin", "admin", "manager", "agent"] }).notNull().default("agent"),
  // Job title/position, e.g. "Direktur Utama" — free text, but a value that
  // exactly matches a preset in packages/shared's JOB_TITLE_LEVELS grants
  // hierarchy-of-control data access (see rbac.ts canAccessRecord). Purely
  // cosmetic for non-matching/custom text.
  jobTitle: text("job_title"),
  territoryId: text("territory_id").references(() => territories.id),
  // Dormant reports-to relation — not yet populated or read anywhere;
  // left without a FK until a real manager->agent assignment flow exists.
  managerId: text("manager_id"),
  isActive: boolean("is_active").notNull().default(true),
  dailyTarget: integer("daily_target").default(5),
  monthlyTarget: integer("monthly_target").default(100),
  refreshToken: text("refresh_token"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  unique("users_company_email_unique").on(table.companyId, table.email),
]);
