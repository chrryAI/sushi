CREATE TABLE "tribeNews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"url" text NOT NULL,
	"source" text,
	"category" text,
	"publishedAt" timestamp with time zone,
	"fetchedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tribeNews_url_unique" UNIQUE("url")
);
