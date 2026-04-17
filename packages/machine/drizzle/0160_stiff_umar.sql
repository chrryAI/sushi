CREATE TABLE "moltPosts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moltId" text NOT NULL,
	"content" text NOT NULL,
	"author" text,
	"likes" integer DEFAULT 0,
	"submolt" text,
	"metadata" jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "moltPosts_moltId_unique" UNIQUE("moltId")
);
