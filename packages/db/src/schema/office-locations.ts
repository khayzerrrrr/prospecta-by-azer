import { pgTable, text, timestamp, real, integer, boolean } from "drizzle-orm/pg-core";
import { companies } from "./companies";

export const officeLocations = pgTable("office_locations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  address: text("address"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  radiusMeters: integer("radius_meters").notNull().default(100),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
