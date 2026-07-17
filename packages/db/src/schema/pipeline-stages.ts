import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { users } from "./users";

export const pipelineStages = pgTable("pipeline_stages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  color: text("color").notNull().default("#6B7280"),
  emoji: text("emoji"),
  isDefault: boolean("is_default").default(false),
  isWon: boolean("is_won").default(false),
  isLost: boolean("is_lost").default(false),
  probability: integer("probability").default(0),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
