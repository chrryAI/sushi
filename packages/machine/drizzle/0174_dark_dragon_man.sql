DROP INDEX "unique_tribe_app_block";--> statement-breakpoint
DROP INDEX "unique_tribe_user_block";--> statement-breakpoint
DROP INDEX "unique_tribe_follow";--> statement-breakpoint
DROP INDEX "unique_user_post_like";--> statement-breakpoint
DROP INDEX "unique_user_comment_like";--> statement-breakpoint
DROP INDEX "unique_user_post_reaction";--> statement-breakpoint
DROP INDEX "unique_user_comment_reaction";--> statement-breakpoint
CREATE INDEX "scheduledJobRuns_jobId_idx" ON "scheduledJobRuns" USING btree ("jobId");--> statement-breakpoint
CREATE INDEX "scheduledJobs_appId_idx" ON "scheduledJobs" USING btree ("appId");--> statement-breakpoint
CREATE INDEX "scheduledJobs_userId_idx" ON "scheduledJobs" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "scheduledJobs_status_nextRunAt_idx" ON "scheduledJobs" USING btree ("status","nextRunAt");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_tribe_user_blocks_app" ON "tribeBlocks" USING btree ("blockerId","blockedAppId") WHERE "tribeBlocks"."blockerId" IS NOT NULL AND "tribeBlocks"."blockedAppId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_tribe_guest_blocks_app" ON "tribeBlocks" USING btree ("blockerGuestId","blockedAppId") WHERE "tribeBlocks"."blockerGuestId" IS NOT NULL AND "tribeBlocks"."blockedAppId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_tribe_user_blocks_user" ON "tribeBlocks" USING btree ("blockerId","blockedUserId") WHERE "tribeBlocks"."blockerId" IS NOT NULL AND "tribeBlocks"."blockedUserId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_tribe_guest_blocks_user" ON "tribeBlocks" USING btree ("blockerGuestId","blockedUserId") WHERE "tribeBlocks"."blockerGuestId" IS NOT NULL AND "tribeBlocks"."blockedUserId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_tribe_follow_user" ON "tribeFollows" USING btree ("followerId","followingAppId") WHERE "tribeFollows"."followerId" IS NOT NULL AND "tribeFollows"."followingAppId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_tribe_follow_guest" ON "tribeFollows" USING btree ("followerGuestId","followingAppId") WHERE "tribeFollows"."followerGuestId" IS NOT NULL AND "tribeFollows"."followingAppId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_post_like_user" ON "tribeLikes" USING btree ("userId","postId") WHERE "tribeLikes"."userId" IS NOT NULL AND "tribeLikes"."postId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_post_like_guest" ON "tribeLikes" USING btree ("guestId","postId") WHERE "tribeLikes"."guestId" IS NOT NULL AND "tribeLikes"."postId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_comment_like_user" ON "tribeLikes" USING btree ("userId","commentId") WHERE "tribeLikes"."userId" IS NOT NULL AND "tribeLikes"."commentId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_comment_like_guest" ON "tribeLikes" USING btree ("guestId","commentId") WHERE "tribeLikes"."guestId" IS NOT NULL AND "tribeLikes"."commentId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_post_reaction_user" ON "tribeReactions" USING btree ("userId","postId","emoji") WHERE "tribeReactions"."userId" IS NOT NULL AND "tribeReactions"."postId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_post_reaction_guest" ON "tribeReactions" USING btree ("guestId","postId","emoji") WHERE "tribeReactions"."guestId" IS NOT NULL AND "tribeReactions"."postId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_comment_reaction_user" ON "tribeReactions" USING btree ("userId","commentId","emoji") WHERE "tribeReactions"."userId" IS NOT NULL AND "tribeReactions"."commentId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_comment_reaction_guest" ON "tribeReactions" USING btree ("guestId","commentId","emoji") WHERE "tribeReactions"."guestId" IS NOT NULL AND "tribeReactions"."commentId" IS NOT NULL;