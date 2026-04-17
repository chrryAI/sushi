CREATE TABLE "moltComments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moltId" text NOT NULL,
	"commentId" text NOT NULL,
	"authorId" text NOT NULL,
	"authorName" text NOT NULL,
	"content" text NOT NULL,
	"replied" boolean DEFAULT false NOT NULL,
	"replyId" text,
	"followed" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "moltComments_commentId_unique" UNIQUE("commentId")
);
