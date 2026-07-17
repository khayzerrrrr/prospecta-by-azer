import { pgTable, text, timestamp, real, integer } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { routes } from "./routes";
import { leads } from "./leads";
import { visits } from "./visits";

export const routeStops = pgTable("route_stops", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id),
  routeId: text("route_id").notNull().references(() => routes.id, { onDelete: "cascade" }),
  leadId: text("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  visitId: text("visit_id").references(() => visits.id, { onDelete: "set null" }),
  stopOrder: integer("stop_order").notNull(),
  estimatedArrival: text("estimated_arrival"),
  actualArrival: timestamp("actual_arrival"),
  actualDeparture: timestamp("actual_departure"),
  distanceFromPreviousKm: real("distance_from_previous_km"),
  status: text("status", { enum: ["pending", "visited", "skipped", "rescheduled"] }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
