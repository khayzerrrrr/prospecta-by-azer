import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const territories = sqliteTable("territories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  region: text("region"),
  description: text("description"),
  color: text("color").default("#3B82F6"),
  boundaryJson: text("boundary_json"),
  centerLat: real("center_lat"),
  centerLng: real("center_lng"),
  zoomLevel: integer("zoom_level").default(12),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
