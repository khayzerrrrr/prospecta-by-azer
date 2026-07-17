import { pgTable, text, timestamp, real, unique } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { users } from "./users";
import { officeLocations } from "./office-locations";

export const attendance = pgTable("attendance", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  // Office employees are geofenced to a specific office_locations row;
  // field employees check in from wherever their day starts, so this
  // stays null for them (no geofence enforced — see attendance.service.ts).
  officeLocationId: text("office_location_id").references(() => officeLocations.id),
  checkinTime: timestamp("checkin_time"),
  checkinLat: real("checkin_lat"),
  checkinLng: real("checkin_lng"),
  checkinDistanceMeters: real("checkin_distance_meters"),
  checkinPhotoUrl: text("checkin_photo_url"),
  checkoutTime: timestamp("checkout_time"),
  checkoutLat: real("checkout_lat"),
  checkoutLng: real("checkout_lng"),
  checkoutPhotoUrl: text("checkout_photo_url"),
  status: text("status", { enum: ["present", "late", "absent", "leave", "permission"] }).notNull().default("present"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  // One attendance record per employee per day
  unique("attendance_user_date_unique").on(table.userId, table.date),
]);
