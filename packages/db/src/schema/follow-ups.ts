import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const followUps = sqliteTable("follow_ups", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  leadId: text("lead_id"),
  visitId: text("visit_id"),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("due_date").notNull(),
  dueTime: text("due_time"),
  status: text("status", { enum: ["pending", "in_progress", "completed", "cancelled"] }).notNull().default("pending"),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  type: text("type", { enum: ["call", "email", "visit", "note", "task", "meeting", "sms", "whatsapp"] }).default("task"),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  completedBy: text("completed_by"),
  reminderSentAt: integer("reminder_sent_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
