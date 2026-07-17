import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { companies } from "./companies";

export const packSettings = pgTable("pack_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id),
  packType: text("pack_type", { enum: ["industry", "ai"] }).notNull(),
  packId: text("pack_id").notNull(),
  enabled: boolean("enabled").notNull().default(false),
  configJson: jsonb("config_json").$type<Record<string, unknown>>().default({}),
  activatedAt: timestamp("activated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
