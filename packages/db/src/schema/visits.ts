import { pgTable, text, timestamp, real, integer, boolean } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { leads } from "./leads";
import { users } from "./users";
import { deals } from "./deals";

export const visits = pgTable("visits", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id),
  leadId: text("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  visitType: text("visit_type", { enum: ["cold_call", "scheduled", "follow_up", "presentation", "closing"] }).notNull().default("scheduled"),
  status: text("status", { enum: ["planned", "checked_in", "in_progress", "completed", "cancelled", "no_show"] }).notNull().default("planned"),
  scheduledDate: text("scheduled_date").notNull(),
  scheduledStartTime: text("scheduled_start_time"),
  scheduledEndTime: text("scheduled_end_time"),
  checkinTime: timestamp("checkin_time"),
  checkoutTime: timestamp("checkout_time"),
  checkinLat: real("checkin_lat"),
  checkinLng: real("checkin_lng"),
  checkoutLat: real("checkout_lat"),
  checkoutLng: real("checkout_lng"),
  checkinDistanceMeters: real("checkin_distance_meters"),
  meetingNotes: text("meeting_notes"),
  nextSteps: text("next_steps"),
  dealId: text("deal_id").references(() => deals.id, { onDelete: "set null" }),
  // Not FK'd to route_stops.id — would create a visits<->route_stops
  // circular import; route_stops.visitId already carries the relationship.
  routeStopId: text("route_stop_id"),
  durationMinutes: integer("duration_minutes"),
  isOfflineSync: boolean("is_offline_sync").default(false),
  syncConfirmedAt: timestamp("sync_confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
