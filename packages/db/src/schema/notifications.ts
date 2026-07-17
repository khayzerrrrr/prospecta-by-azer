import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { users } from "./users";

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message"),
  type: text("type", { enum: ["visit_reminder", "follow_up_due", "visit_assigned", "checkin_alert", "deal_stage_change", "team_update", "system"] }).notNull(),
  referenceType: text("reference_type"),
  referenceId: text("reference_id"),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
