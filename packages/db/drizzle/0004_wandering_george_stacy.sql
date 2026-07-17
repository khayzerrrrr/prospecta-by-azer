ALTER TABLE "companies" ADD COLUMN "industry" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "claim_code" text;--> statement-breakpoint
ALTER TABLE "employee_profiles" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "job_title" text;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_claim_code_unique" UNIQUE("claim_code");