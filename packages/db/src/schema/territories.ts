import { pgTable, text, timestamp, real, integer, jsonb } from "drizzle-orm/pg-core";
import { companies } from "./companies";

export const territories = pgTable("territories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  region: text("region"),
  description: text("description"),
  color: text("color").default("#3B82F6"),
  boundaryJson: jsonb("boundary_json"),
  centerLat: real("center_lat"),
  centerLng: real("center_lng"),
  zoomLevel: integer("zoom_level").default(12),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
