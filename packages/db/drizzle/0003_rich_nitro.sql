CREATE TABLE "kpi_definitions" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"unit" text NOT NULL,
	"target_value" integer DEFAULT 0 NOT NULL,
	"weight" integer DEFAULT 100 NOT NULL,
	"applies_to" text DEFAULT 'all' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"employee_profile_id" text NOT NULL,
	"kpi_definition_id" text NOT NULL,
	"period_month" integer NOT NULL,
	"period_year" integer NOT NULL,
	"target_value" integer DEFAULT 0 NOT NULL,
	"actual_value" integer DEFAULT 0 NOT NULL,
	"achievement_percent" real DEFAULT 0 NOT NULL,
	"notes" text,
	"scored_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kpi_score_employee_period_unique" UNIQUE("employee_profile_id","kpi_definition_id","period_month","period_year")
);
--> statement-breakpoint
ALTER TABLE "kpi_definitions" ADD CONSTRAINT "kpi_definitions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_scores" ADD CONSTRAINT "kpi_scores_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_scores" ADD CONSTRAINT "kpi_scores_employee_profile_id_employee_profiles_id_fk" FOREIGN KEY ("employee_profile_id") REFERENCES "public"."employee_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_scores" ADD CONSTRAINT "kpi_scores_kpi_definition_id_kpi_definitions_id_fk" FOREIGN KEY ("kpi_definition_id") REFERENCES "public"."kpi_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_scores" ADD CONSTRAINT "kpi_scores_scored_by_users_id_fk" FOREIGN KEY ("scored_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;