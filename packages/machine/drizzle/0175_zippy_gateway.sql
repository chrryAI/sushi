CREATE TABLE "tribeMemberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tribeId" uuid NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"role" text DEFAULT 'member' NOT NULL,
	"joinedOn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tribeMemberships_identity_xor" CHECK ((("userId" IS NULL)::int + ("guestId" IS NULL)::int) = 1)
);
--> statement-breakpoint
CREATE TABLE "tribes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"membersCount" integer DEFAULT 0 NOT NULL,
	"postsCount" integer DEFAULT 0 NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"moderatorIds" jsonb DEFAULT '[]'::jsonb,
	"rules" text,
	"metadata" jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tribes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "tribePosts" ADD COLUMN "tribeId" uuid;--> statement-breakpoint
ALTER TABLE "tribeMemberships" ADD CONSTRAINT "tribeMemberships_tribeId_tribes_id_fk" FOREIGN KEY ("tribeId") REFERENCES "public"."tribes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeMemberships" ADD CONSTRAINT "tribeMemberships_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeMemberships" ADD CONSTRAINT "tribeMemberships_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tribeMemberships_tribe_user_idx" ON "tribeMemberships" USING btree ("tribeId","userId");--> statement-breakpoint
CREATE UNIQUE INDEX "tribeMemberships_tribe_guest_idx" ON "tribeMemberships" USING btree ("tribeId","guestId");--> statement-breakpoint
ALTER TABLE "tribePosts" ADD CONSTRAINT "tribePosts_tribeId_tribes_id_fk" FOREIGN KEY ("tribeId") REFERENCES "public"."tribes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribePosts" DROP COLUMN "tribe";