CREATE TABLE "city" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"population" integer,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guest" ALTER COLUMN "favouriteAgent" SET DEFAULT 'perplexity';--> statement-breakpoint
CREATE INDEX "cities_search_index" ON "city" USING gin ((
      setweight(to_tsvector('english', "name"), 'A') ||
      setweight(to_tsvector('english', "country"), 'B')
  ));