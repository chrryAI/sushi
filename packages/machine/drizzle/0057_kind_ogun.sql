ALTER TABLE "characterTags" RENAME TO "characterProfiles";--> statement-breakpoint
ALTER TABLE "characterProfiles" DROP CONSTRAINT "characterTags_agentId_aiAgents_id_fk";
--> statement-breakpoint
ALTER TABLE "characterProfiles" DROP CONSTRAINT "characterTags_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "characterProfiles" DROP CONSTRAINT "characterTags_guestId_guest_id_fk";
--> statement-breakpoint
ALTER TABLE "characterProfiles" ADD COLUMN "visibility" text DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "characterProfiles" ADD CONSTRAINT "characterProfiles_agentId_aiAgents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."aiAgents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characterProfiles" ADD CONSTRAINT "characterProfiles_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characterProfiles" ADD CONSTRAINT "characterProfiles_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;