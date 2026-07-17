CREATE TABLE "attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"office_location_id" text,
	"checkin_time" timestamp,
	"checkin_lat" real,
	"checkin_lng" real,
	"checkin_distance_meters" real,
	"checkin_photo_url" text,
	"checkout_time" timestamp,
	"checkout_lat" real,
	"checkout_lng" real,
	"checkout_photo_url" text,
	"status" text DEFAULT 'present' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_user_date_unique" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "employee_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"user_id" text NOT NULL,
	"employee_type" text DEFAULT 'field' NOT NULL,
	"employment_status" text DEFAULT 'active' NOT NULL,
	"base_salary" integer DEFAULT 0,
	"bank_name" text,
	"bank_account_number" text,
	"bank_account_name" text,
	"tax_status" text DEFAULT 'TK/0',
	"npwp" text,
	"bpjs_kesehatan_enrolled" boolean DEFAULT false NOT NULL,
	"bpjs_ketenagakerjaan_enrolled" boolean DEFAULT false NOT NULL,
	"join_date" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employee_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "office_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"radius_meters" integer DEFAULT 100 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_office_location_id_office_locations_id_fk" FOREIGN KEY ("office_location_id") REFERENCES "public"."office_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_locations" ADD CONSTRAINT "office_locations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;