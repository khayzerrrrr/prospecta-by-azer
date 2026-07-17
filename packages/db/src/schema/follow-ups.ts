import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { leads } from "./leads";
import { visits } from "./visits";
import { users } from "./users";

export const followUps = pgTable("follow_ups", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id),
  leadId: text("lead_id").references(() => leads.id, { onDelete: "set null" }),
  visitId: text("visit_id").references(() => visits.id, { onDelete: "set null" }),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("due_date").notNull(),
  dueTime: text("due_time"),
  status: text("status", { enum: ["pending", "in_progress", "completed", "cancelled"] }).notNull().default("pending"),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  type: text("type", { enum: ["call", "email", "visit", "note", "task", "meeting", "sms", "whatsapp"] }).default("task"),
  completedAt: timestamp("completed_at"),
  completedBy: text("completed_by").references(() => users.id),
  reminderSentAt: timestamp("reminder_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
