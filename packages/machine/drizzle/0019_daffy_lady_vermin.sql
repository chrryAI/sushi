ALTER TABLE "threads" RENAME COLUMN "bookmark" TO "bookmarks";--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "reactions" jsonb;