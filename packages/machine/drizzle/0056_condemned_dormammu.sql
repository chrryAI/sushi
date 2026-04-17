ALTER TABLE "character_profiles" RENAME TO "characterTags";--> statement-breakpoint
ALTER TABLE "characterTags" DROP CONSTRAINT "character_profiles_agentId_aiAgents_id_fk";
--> statement-breakpoint
ALTER TABLE "characterTags" DROP CONSTRAINT "character_profiles_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "characterTags" DROP CONSTRAINT "character_profiles_guestId_guest_id_fk";
--> statement-breakpoint
ALTER TABLE "characterTags" ADD CONSTRAINT "characterTags_agentId_aiAgents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."aiAgents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characterTags" ADD CONSTRAINT "characterTags_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characterTags" ADD CONSTRAINT "characterTags_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;