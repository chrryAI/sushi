ALTER TABLE "mood" RENAME COLUMN "taskLogId" TO "taskId";--> statement-breakpoint
ALTER TABLE "mood" DROP CONSTRAINT "mood_taskLogId_taskLog_id_fk";
--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "taskId" uuid;--> statement-breakpoint
ALTER TABLE "mood" ADD CONSTRAINT "mood_taskId_task_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_taskId_task_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;