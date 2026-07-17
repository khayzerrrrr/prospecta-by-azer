import { pgTable, text, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { users } from "./users";
import { territories } from "./territories";

export const leads = pgTable("leads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name"),
  contactTitle: text("contact_title"),
  phone: text("phone"),
  email: text("email"),
  alternativePhone: text("alternative_phone"),
  address: text("address"),
  city: text("city"),
  province: text("province"),
  postalCode: text("postal_code"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  status: text("status", { enum: ["new", "contacted", "qualified", "unqualified", "converted"] }).notNull().default("new"),
  source: text("source", { enum: ["manual", "import", "referral", "website", "event"] }).default("manual"),
  qualification: text("qualification", { enum: ["hot", "warm", "cold"] }).default("cold"),
  segment: text("segment", { enum: ["enterprise", "smb", "government", "education", "other"] }).default("other"),
  industry: text("industry"),
  website: text("website"),
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>().default([]),
  customFields: jsonb("custom_fields").$type<Record<string, unknown>>().default({}),
  assignedTo: text("assigned_to").references(() => users.id, { onDelete: "set null" }),
  territoryId: text("territory_id").references(() => territories.id),
  createdBy: text("created_by").notNull().references(() => users.id),
  // Not FK'd to deals.id — would create a leads<->deals circular import;
  // deals.leadId already carries the authoritative relationship.
  convertedDealId: text("converted_deal_id"),
  lastContactedAt: timestamp("last_contacted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
