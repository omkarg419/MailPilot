CREATE TABLE "MailPilot_agent_allowlist" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"userId" varchar(255),
	"grantedBy" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "MailPilot_agent_allowlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "MailPilot_agent_allowlist" ADD CONSTRAINT "MailPilot_agent_allowlist_userId_MailPilot_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."MailPilot_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_allowlist_user_idx" ON "MailPilot_agent_allowlist" USING btree ("userId");
