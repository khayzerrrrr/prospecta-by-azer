import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { leads } from "./leads";
import { users } from "./users";
import { pipelineStages } from "./pipeline-stages";

export const deals = pgTable("deals", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  leadId: text("lead_id").references(() => leads.id, { onDelete: "set null" }),
  stageId: text("stage_id").notNull().references(() => pipelineStages.id),
  userId: text("user_id").notNull().references(() => users.id),
  value: integer("value").default(0),
  currency: text("currency").default("IDR"),
  probability: integer("probability").default(0),
  expectedCloseDate: text("expected_close_date"),
  actualCloseDate: text("actual_close_date"),
  notes: text("notes"),
  products: jsonb("products").$type<unknown[]>().default([]),
  lostReason: text("lost_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
