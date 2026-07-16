import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const packSettings = sqliteTable("pack_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().default("default"),
  packType: text("pack_type", { enum: ["industry", "ai"] }).notNull(),
  packId: text("pack_id").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  configJson: text("config_json").default("{}"),
  activatedAt: integer("activated_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
