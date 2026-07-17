import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const companies = pgTable("companies", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  subscriptionStatus: text("subscription_status", { enum: ["trial", "active", "suspended", "cancelled"] }).notNull().default("trial"),
  // Single industry assigned once at provisioning by master_account — validated
  // against packages/shared's INDUSTRIES keys at the app layer, not a DB enum,
  // so new industries don't need a migration. Null = generic/no industry.
  industry: text("industry"),
  // One-time code master_account shares out-of-band (WA/email) so the company
  // can self-register its one super_admin account via POST /auth/claim-company.
  // Left set after being used — enforcement of "already claimed" is done by
  // checking for an existing super_admin user, not by clearing this column.
  claimCode: text("claim_code").unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
