import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const deals = sqliteTable("deals", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  leadId: text("lead_id"),
  stageId: text("stage_id").notNull(),
  userId: text("user_id").notNull(),
  value: integer("value").default(0),
  currency: text("currency").default("IDR"),
  probability: integer("probability").default(0),
  expectedCloseDate: text("expected_close_date"),
  actualCloseDate: text("actual_close_date"),
  notes: text("notes"),
  products: text("products").default("[]"),
  lostReason: text("lost_reason"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
