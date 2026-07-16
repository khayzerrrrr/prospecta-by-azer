import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  role: text("role", { enum: ["super_admin", "admin", "manager", "agent"] }).notNull().default("agent"),
  territoryId: text("territory_id"),
  managerId: text("manager_id"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  dailyTarget: integer("daily_target").default(5),
  monthlyTarget: integer("monthly_target").default(100),
  refreshToken: text("refresh_token"),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
