import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const routeStops = sqliteTable("route_stops", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  routeId: text("route_id").notNull(),
  leadId: text("lead_id").notNull(),
  visitId: text("visit_id"),
  stopOrder: integer("stop_order").notNull(),
  estimatedArrival: text("estimated_arrival"),
  actualArrival: integer("actual_arrival", { mode: "timestamp" }),
  actualDeparture: integer("actual_departure", { mode: "timestamp" }),
  distanceFromPreviousKm: real("distance_from_previous_km"),
  status: text("status", { enum: ["pending", "visited", "skipped", "rescheduled"] }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
