CREATE TABLE "codeEmbeddings" (
	"id" text PRIMARY KEY NOT NULL,
	"repoName" text NOT NULL,
	"commitHash" text NOT NULL,
	"filepath" text NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"startLine" integer,
	"endLine" integer,
	"embedding" vector(1536),
	"metadata" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "codebaseQueries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"appId" uuid,
	"repoName" text NOT NULL,
	"query" text NOT NULL,
	"responseTime" integer,
	"tokensUsed" integer,
	"costUSD" real,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "codebaseQueries" ADD CONSTRAINT "codebaseQueries_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codebaseQueries" ADD CONSTRAINT "codebaseQueries_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codebaseQueries" ADD CONSTRAINT "codebaseQueries_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "codeEmbeddings_repoName_idx" ON "codeEmbeddings" USING btree ("repoName");--> statement-breakpoint
CREATE INDEX "codeEmbeddings_filepath_idx" ON "codeEmbeddings" USING btree ("filepath");--> statement-breakpoint
CREATE INDEX "codeEmbeddings_type_idx" ON "codeEmbeddings" USING btree ("type");--> statement-breakpoint
CREATE INDEX "codeEmbeddings_commitHash_idx" ON "codeEmbeddings" USING btree ("commitHash");--> statement-breakpoint
CREATE INDEX "codeEmbeddings_embedding_idx" ON "codeEmbeddings" USING ivfflat ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "codebaseQueries_userId_idx" ON "codebaseQueries" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "codebaseQueries_guestId_idx" ON "codebaseQueries" USING btree ("guestId");--> statement-breakpoint
CREATE INDEX "codebaseQueries_appId_idx" ON "codebaseQueries" USING btree ("appId");--> statement-breakpoint
CREATE INDEX "codebaseQueries_repoName_idx" ON "codebaseQueries" USING btree ("repoName");--> statement-breakpoint
CREATE INDEX "codebaseQueries_createdAt_idx" ON "codebaseQueries" USING btree ("createdAt");