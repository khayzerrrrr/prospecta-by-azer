import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const routes = sqliteTable("routes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  date: text("date").notNull(),
  status: text("status", { enum: ["draft", "active", "completed", "archived"] }).notNull().default("draft"),
  totalDistanceKm: real("total_distance_km"),
  estimatedDurationMinutes: integer("estimated_duration_minutes"),
  actualDurationMinutes: integer("actual_duration_minutes"),
  startLat: real("start_lat"),
  startLng: real("start_lng"),
  endLat: real("end_lat"),
  endLng: real("end_lng"),
  polylineEncoded: text("polyline_encoded"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
