CREATE TABLE "MailPilot_agent_usage" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "MailPilot_agent_usage" ADD CONSTRAINT "MailPilot_agent_usage_userId_MailPilot_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."MailPilot_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_usage_user_created_idx" ON "MailPilot_agent_usage" USING btree ("userId","createdAt");