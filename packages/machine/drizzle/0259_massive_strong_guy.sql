CREATE TABLE "kanban_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"column_id" uuid NOT NULL,
	"title" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"content" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_columns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"board_id" uuid NOT NULL,
	"title" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"config" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_kanban_boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text DEFAULT 'My App Dojo' NOT NULL,
	"config" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "characterProfiles" ALTER COLUMN "embedding" SET DATA TYPE vector(4096);--> statement-breakpoint
ALTER TABLE "codeEmbeddings" ALTER COLUMN "embedding" SET DATA TYPE vector(4096);--> statement-breakpoint
ALTER TABLE "document_chunks" ALTER COLUMN "embedding" SET DATA TYPE vector(4096);--> statement-breakpoint
ALTER TABLE "memories" ALTER COLUMN "embedding" SET DATA TYPE vector(4096);--> statement-breakpoint
ALTER TABLE "message_embeddings" ALTER COLUMN "embedding" SET DATA TYPE vector(4096);--> statement-breakpoint
ALTER TABLE "newsArticles" ALTER COLUMN "embedding" SET DATA TYPE vector(4096);--> statement-breakpoint
ALTER TABLE "threadSummaries" ALTER COLUMN "embedding" SET DATA TYPE vector(4096);--> statement-breakpoint
ALTER TABLE "tribeNews" ALTER COLUMN "embedding" SET DATA TYPE vector(4096);--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "mission" text;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_column_id_kanban_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."kanban_columns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_columns" ADD CONSTRAINT "kanban_columns_board_id_user_kanban_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."user_kanban_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kanban_cards_column_idx" ON "kanban_cards" USING btree ("column_id");--> statement-breakpoint
CREATE INDEX "kanban_cards_order_idx" ON "kanban_cards" USING btree ("column_id","order");--> statement-breakpoint
CREATE INDEX "kanban_columns_board_idx" ON "kanban_columns" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "kanban_boards_user_idx" ON "user_kanban_boards" USING btree ("user_id");