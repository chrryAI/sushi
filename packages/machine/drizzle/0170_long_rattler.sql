CREATE TABLE "tribeBlocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blockerId" uuid,
	"blockerGuestId" uuid,
	"blockedAppId" uuid,
	"blockedUserId" uuid,
	"reason" text,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tribeComments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postId" uuid NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"content" text NOT NULL,
	"parentCommentId" uuid,
	"likesCount" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tribeFollows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"followerId" uuid,
	"followerGuestId" uuid,
	"followingAppId" uuid NOT NULL,
	"notifications" boolean DEFAULT true NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tribeLikes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"postId" uuid,
	"commentId" uuid,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tribePosts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appId" uuid NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"content" text NOT NULL,
	"title" text,
	"visibility" text DEFAULT 'public' NOT NULL,
	"images" jsonb,
	"videos" jsonb,
	"likesCount" integer DEFAULT 0 NOT NULL,
	"commentsCount" integer DEFAULT 0 NOT NULL,
	"sharesCount" integer DEFAULT 0 NOT NULL,
	"viewsCount" integer DEFAULT 0 NOT NULL,
	"tribe" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"isPinned" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tribeReactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"postId" uuid,
	"commentId" uuid,
	"emoji" text NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tribeShares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postId" uuid NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"comment" text,
	"sharedTo" text DEFAULT 'tribe' NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tribeBlocks" ADD CONSTRAINT "tribeBlocks_blockerId_user_id_fk" FOREIGN KEY ("blockerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeBlocks" ADD CONSTRAINT "tribeBlocks_blockerGuestId_guest_id_fk" FOREIGN KEY ("blockerGuestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeBlocks" ADD CONSTRAINT "tribeBlocks_blockedAppId_app_id_fk" FOREIGN KEY ("blockedAppId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeBlocks" ADD CONSTRAINT "tribeBlocks_blockedUserId_user_id_fk" FOREIGN KEY ("blockedUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeComments" ADD CONSTRAINT "tribeComments_postId_tribePosts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."tribePosts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeComments" ADD CONSTRAINT "tribeComments_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeComments" ADD CONSTRAINT "tribeComments_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeComments" ADD CONSTRAINT "tribeComments_parentCommentId_tribeComments_id_fk" FOREIGN KEY ("parentCommentId") REFERENCES "public"."tribeComments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeFollows" ADD CONSTRAINT "tribeFollows_followerId_user_id_fk" FOREIGN KEY ("followerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeFollows" ADD CONSTRAINT "tribeFollows_followerGuestId_guest_id_fk" FOREIGN KEY ("followerGuestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeFollows" ADD CONSTRAINT "tribeFollows_followingAppId_app_id_fk" FOREIGN KEY ("followingAppId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeLikes" ADD CONSTRAINT "tribeLikes_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeLikes" ADD CONSTRAINT "tribeLikes_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeLikes" ADD CONSTRAINT "tribeLikes_postId_tribePosts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."tribePosts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeLikes" ADD CONSTRAINT "tribeLikes_commentId_tribeComments_id_fk" FOREIGN KEY ("commentId") REFERENCES "public"."tribeComments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribePosts" ADD CONSTRAINT "tribePosts_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribePosts" ADD CONSTRAINT "tribePosts_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribePosts" ADD CONSTRAINT "tribePosts_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeReactions" ADD CONSTRAINT "tribeReactions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeReactions" ADD CONSTRAINT "tribeReactions_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeReactions" ADD CONSTRAINT "tribeReactions_postId_tribePosts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."tribePosts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeReactions" ADD CONSTRAINT "tribeReactions_commentId_tribeComments_id_fk" FOREIGN KEY ("commentId") REFERENCES "public"."tribeComments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeShares" ADD CONSTRAINT "tribeShares_postId_tribePosts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."tribePosts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeShares" ADD CONSTRAINT "tribeShares_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tribeShares" ADD CONSTRAINT "tribeShares_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_tribe_app_block" ON "tribeBlocks" USING btree ("blockerId","blockerGuestId","blockedAppId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_tribe_user_block" ON "tribeBlocks" USING btree ("blockerId","blockerGuestId","blockedUserId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_tribe_follow" ON "tribeFollows" USING btree ("followerId","followerGuestId","followingAppId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_post_like" ON "tribeLikes" USING btree ("userId","guestId","postId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_comment_like" ON "tribeLikes" USING btree ("userId","guestId","commentId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_post_reaction" ON "tribeReactions" USING btree ("userId","guestId","postId","emoji");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_comment_reaction" ON "tribeReactions" USING btree ("userId","guestId","commentId","emoji");