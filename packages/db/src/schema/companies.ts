import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

export const companies = pgTable("companies", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  subscriptionStatus: text("subscription_status", { enum: ["trial", "active", "suspended", "cancelled"] }).notNull().default("trial"),
  enabledPacks: jsonb("enabled_packs").$type<{ industry: string[]; ai: string[] }>().default({ industry: [], ai: [] }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
