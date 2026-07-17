import { pgTable, text, timestamp, real, integer } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { users } from "./users";

export const routes = pgTable("routes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id),
  userId: text("user_id").notNull().references(() => users.id),
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
