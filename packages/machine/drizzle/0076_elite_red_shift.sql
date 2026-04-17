CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"guestId" uuid,
	"category" text DEFAULT 'other' NOT NULL,
	"amount" integer NOT NULL,
	"period" text DEFAULT 'monthly' NOT NULL,
	"startDate" timestamp with time zone DEFAULT now() NOT NULL,
	"endDate" timestamp with time zone,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"threadId" uuid,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"description" text NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"receipt" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"isShared" boolean DEFAULT false NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sharedExpenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expenseId" uuid NOT NULL,
	"threadId" uuid NOT NULL,
	"splits" jsonb NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_threadId_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharedExpenses" ADD CONSTRAINT "sharedExpenses_expenseId_expenses_id_fk" FOREIGN KEY ("expenseId") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharedExpenses" ADD CONSTRAINT "sharedExpenses_threadId_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budgets_user_idx" ON "budgets" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "budgets_category_idx" ON "budgets" USING btree ("category");--> statement-breakpoint
CREATE INDEX "budgets_active_idx" ON "budgets" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "expenses_user_idx" ON "expenses" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "expenses_guest_idx" ON "expenses" USING btree ("guestId");--> statement-breakpoint
CREATE INDEX "expenses_thread_idx" ON "expenses" USING btree ("threadId");--> statement-breakpoint
CREATE INDEX "expenses_date_idx" ON "expenses" USING btree ("date");--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "expenses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "shared_expenses_expense_idx" ON "sharedExpenses" USING btree ("expenseId");--> statement-breakpoint
CREATE INDEX "shared_expenses_thread_idx" ON "sharedExpenses" USING btree ("threadId");