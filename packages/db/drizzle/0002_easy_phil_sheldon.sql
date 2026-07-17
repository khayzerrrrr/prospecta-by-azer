CREATE TABLE "employee_salary_components" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_profile_id" text NOT NULL,
	"component_id" text NOT NULL,
	"amount_override" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "emp_salary_component_unique" UNIQUE("employee_profile_id","component_id")
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"period_month" integer NOT NULL,
	"period_year" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payroll_run_period_unique" UNIQUE("company_id","period_month","period_year")
);
--> statement-breakpoint
CREATE TABLE "payslips" (
	"id" text PRIMARY KEY NOT NULL,
	"payroll_run_id" text NOT NULL,
	"company_id" text NOT NULL,
	"employee_profile_id" text NOT NULL,
	"user_id" text NOT NULL,
	"base_salary" integer DEFAULT 0 NOT NULL,
	"total_allowance" integer DEFAULT 0 NOT NULL,
	"total_deduction" integer DEFAULT 0 NOT NULL,
	"total_bonus" integer DEFAULT 0 NOT NULL,
	"total_incentive" integer DEFAULT 0 NOT NULL,
	"bpjs_kesehatan_employee" integer DEFAULT 0 NOT NULL,
	"bpjs_kesehatan_employer" integer DEFAULT 0 NOT NULL,
	"bpjs_ketenagakerjaan_employee" integer DEFAULT 0 NOT NULL,
	"bpjs_ketenagakerjaan_employer" integer DEFAULT 0 NOT NULL,
	"gross_pay" integer DEFAULT 0 NOT NULL,
	"pph21" integer DEFAULT 0 NOT NULL,
	"net_pay" integer DEFAULT 0 NOT NULL,
	"days_present" integer DEFAULT 0 NOT NULL,
	"days_absent" integer DEFAULT 0 NOT NULL,
	"days_late" integer DEFAULT 0 NOT NULL,
	"components_breakdown" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payslip_run_employee_unique" UNIQUE("payroll_run_id","employee_profile_id")
);
--> statement-breakpoint
CREATE TABLE "salary_components" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"amount_type" text DEFAULT 'fixed' NOT NULL,
	"default_amount" integer DEFAULT 0 NOT NULL,
	"taxable" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_salary_components" ADD CONSTRAINT "employee_salary_components_employee_profile_id_employee_profiles_id_fk" FOREIGN KEY ("employee_profile_id") REFERENCES "public"."employee_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_salary_components" ADD CONSTRAINT "employee_salary_components_component_id_salary_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."salary_components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_profile_id_employee_profiles_id_fk" FOREIGN KEY ("employee_profile_id") REFERENCES "public"."employee_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_components" ADD CONSTRAINT "salary_components_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;