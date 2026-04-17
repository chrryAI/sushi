CREATE TABLE "account" (
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "aiAgents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"displayName" text NOT NULL,
	"version" text NOT NULL,
	"apiKey" text NOT NULL,
	"apiURL" text NOT NULL,
	"description" text,
	"state" text DEFAULT 'active' NOT NULL,
	"creditCost" integer DEFAULT 1 NOT NULL,
	"modelId" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"capabilities" jsonb DEFAULT '{"text":true,"image":false,"audio":false,"video":false,"webSearch":false}'::jsonb NOT NULL,
	"authorization" text DEFAULT 'all' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text,
	"app" text,
	"os" text,
	"osVersion" text,
	"screenWidth" integer,
	"screenHeight" integer,
	"language" text,
	"timezone" text,
	"browser" text,
	"browserVersion" text,
	"appVersion" text,
	"userId" uuid,
	"guestId" uuid,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	"fingerprint" text NOT NULL,
	CONSTRAINT "device_fingerprint_unique" UNIQUE("fingerprint")
);
--> statement-breakpoint
CREATE TABLE "guest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	"ip" text NOT NULL,
	"fingerprint" text NOT NULL,
	"activeOn" timestamp with time zone DEFAULT now() NOT NULL,
	"credits" integer DEFAULT 30 NOT NULL,
	"isBot" boolean DEFAULT false NOT NULL,
	"timezone" text
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agentId" uuid,
	"agentVersion" text,
	"userId" uuid,
	"guestId" uuid,
	"content" text NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	"readOn" timestamp with time zone,
	"threadId" uuid NOT NULL,
	"webSearchResult" jsonb,
	"searchContext" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"subscriptionId" text NOT NULL,
	"sessionId" text,
	"status" text NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	"plan" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "systemLogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" text NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"message" text,
	"object" jsonb,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"guestId" uuid,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"aiResponse" text NOT NULL,
	"isPrivate" boolean DEFAULT false NOT NULL,
	"star" integer
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp with time zone,
	"image" text,
	"password" text,
	"role" text DEFAULT 'user' NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"createdOn" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedOn" timestamp with time zone DEFAULT now() NOT NULL,
	"activeOn" timestamp with time zone DEFAULT now(),
	"ip" text,
	"language" text DEFAULT 'en' NOT NULL,
	"fingerprint" text,
	"subscribedOn" timestamp with time zone,
	"fileUploadsToday" integer DEFAULT 0 NOT NULL,
	"fileUploadsThisHour" integer DEFAULT 0 NOT NULL,
	"totalFileSizeToday" integer DEFAULT 0 NOT NULL,
	"lastFileUploadReset" timestamp with time zone,
	"timezone" text,
	"appleId" text,
	"credits" integer DEFAULT 150 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device" ADD CONSTRAINT "device_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device" ADD CONSTRAINT "device_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_agentId_aiAgents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."aiAgents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_threadId_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "systemLogs" ADD CONSTRAINT "systemLogs_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "systemLogs" ADD CONSTRAINT "systemLogs_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_guestId_guest_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "device_fingerprint_idx" ON "device" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "messages_search_index" ON "messages" USING gin ((
        setweight(to_tsvector('english', "content"), 'A')
      ));--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_userId_idx" ON "subscription" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_search_index" ON "user" USING gin ((
      setweight(to_tsvector('english', "name"), 'A') ||
      setweight(to_tsvector('english', "email"), 'B')
  ));