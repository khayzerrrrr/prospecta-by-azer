import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const pipelineStages = sqliteTable("pipeline_stages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  color: text("color").notNull().default("#6B7280"),
  emoji: text("emoji"),
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
  isWon: integer("is_won", { mode: "boolean" }).default(false),
  isLost: integer("is_lost", { mode: "boolean" }).default(false),
  probability: integer("probability").default(0),
  createdBy: text("created_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
