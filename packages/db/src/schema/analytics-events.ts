import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { users } from "./users";

export const analyticsEvents = pgTable("analytics_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
