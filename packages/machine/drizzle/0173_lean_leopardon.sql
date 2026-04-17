DROP INDEX "unique_tribe_app_block";--> statement-breakpoint
DROP INDEX "unique_tribe_user_block";--> statement-breakpoint
DROP INDEX "unique_tribe_follow";--> statement-breakpoint
DROP INDEX "unique_user_post_like";--> statement-breakpoint
DROP INDEX "unique_user_comment_like";--> statement-breakpoint
DROP INDEX "unique_user_post_reaction";--> statement-breakpoint
DROP INDEX "unique_user_comment_reaction";--> statement-breakpoint
CREATE UNIQUE INDEX "unique_tribe_app_block" ON "tribeBlocks" USING btree ("blockerId","blockerGuestId","blockedAppId") WHERE "tribeBlocks"."blockedAppId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_tribe_user_block" ON "tribeBlocks" USING btree ("blockerId","blockerGuestId","blockedUserId") WHERE "tribeBlocks"."blockedUserId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_tribe_follow" ON "tribeFollows" USING btree ("followerId","followerGuestId","followingAppId") WHERE "tribeFollows"."followingAppId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_post_like" ON "tribeLikes" USING btree ("userId","guestId","postId") WHERE "tribeLikes"."postId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_comment_like" ON "tribeLikes" USING btree ("userId","guestId","commentId") WHERE "tribeLikes"."commentId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_post_reaction" ON "tribeReactions" USING btree ("userId","guestId","postId","emoji") WHERE "tribeReactions"."postId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_comment_reaction" ON "tribeReactions" USING btree ("userId","guestId","commentId","emoji") WHERE "tribeReactions"."commentId" IS NOT NULL;