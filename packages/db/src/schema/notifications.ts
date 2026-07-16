import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  type: text("type", { enum: ["visit_reminder", "follow_up_due", "visit_assigned", "checkin_alert", "deal_stage_change", "team_update", "system"] }).notNull(),
  referenceType: text("reference_type"),
  referenceId: text("reference_id"),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  readAt: integer("read_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
