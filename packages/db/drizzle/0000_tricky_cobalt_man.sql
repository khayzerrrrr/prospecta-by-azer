CREATE TABLE "analytics_events" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"user_id" text,
	"event_type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"subscription_status" text DEFAULT 'trial' NOT NULL,
	"enabled_packs" jsonb DEFAULT '{"industry":[],"ai":[]}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"lead_id" text,
	"stage_id" text NOT NULL,
	"user_id" text NOT NULL,
	"value" integer DEFAULT 0,
	"currency" text DEFAULT 'IDR',
	"probability" integer DEFAULT 0,
	"expected_close_date" text,
	"actual_close_date" text,
	"notes" text,
	"products" jsonb DEFAULT '[]'::jsonb,
	"lost_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follow_ups" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"lead_id" text,
	"visit_id" text,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" text NOT NULL,
	"due_time" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'medium',
	"type" text DEFAULT 'task',
	"completed_at" timestamp,
	"completed_by" text,
	"reminder_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"company_name" text NOT NULL,
	"contact_name" text,
	"contact_title" text,
	"phone" text,
	"email" text,
	"alternative_phone" text,
	"address" text,
	"city" text,
	"province" text,
	"postal_code" text,
	"latitude" real,
	"longitude" real,
	"status" text DEFAULT 'new' NOT NULL,
	"source" text DEFAULT 'manual',
	"qualification" text DEFAULT 'cold',
	"segment" text DEFAULT 'other',
	"industry" text,
	"website" text,
	"notes" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"assigned_to" text,
	"territory_id" text,
	"created_by" text NOT NULL,
	"converted_deal_id" text,
	"last_contacted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text,
	"type" text NOT NULL,
	"reference_type" text,
	"reference_id" text,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pack_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"pack_type" text NOT NULL,
	"pack_id" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"config_json" jsonb DEFAULT '{}'::jsonb,
	"activated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_stages" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"order" integer NOT NULL,
	"color" text DEFAULT '#6B7280' NOT NULL,
	"emoji" text,
	"is_default" boolean DEFAULT false,
	"is_won" boolean DEFAULT false,
	"is_lost" boolean DEFAULT false,
	"probability" integer DEFAULT 0,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_stops" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"route_id" text NOT NULL,
	"lead_id" text NOT NULL,
	"visit_id" text,
	"stop_order" integer NOT NULL,
	"estimated_arrival" text,
	"actual_arrival" timestamp,
	"actual_departure" timestamp,
	"distance_from_previous_km" real,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"date" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_distance_km" real,
	"estimated_duration_minutes" integer,
	"actual_duration_minutes" integer,
	"start_lat" real,
	"start_lng" real,
	"end_lat" real,
	"end_lng" real,
	"polyline_encoded" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "territories" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"region" text,
	"description" text,
	"color" text DEFAULT '#3B82F6',
	"boundary_json" jsonb,
	"center_lat" real,
	"center_lng" real,
	"zoom_level" integer DEFAULT 12,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"avatar_url" text,
	"role" text DEFAULT 'agent' NOT NULL,
	"territory_id" text,
	"manager_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"daily_target" integer DEFAULT 5,
	"monthly_target" integer DEFAULT 100,
	"refresh_token" text,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_company_email_unique" UNIQUE("company_id","email")
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"lead_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"visit_type" text DEFAULT 'scheduled' NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"scheduled_date" text NOT NULL,
	"scheduled_start_time" text,
	"scheduled_end_time" text,
	"checkin_time" timestamp,
	"checkout_time" timestamp,
	"checkin_lat" real,
	"checkin_lng" real,
	"checkout_lat" real,
	"checkout_lng" real,
	"checkin_distance_meters" real,
	"meeting_notes" text,
	"next_steps" text,
	"deal_id" text,
	"route_stop_id" text,
	"duration_minutes" integer,
	"is_offline_sync" boolean DEFAULT false,
	"sync_confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_stage_id_pipeline_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_territory_id_territories_id_fk" FOREIGN KEY ("territory_id") REFERENCES "public"."territories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack_settings" ADD CONSTRAINT "pack_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "territories" ADD CONSTRAINT "territories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_territory_id_territories_id_fk" FOREIGN KEY ("territory_id") REFERENCES "public"."territories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;