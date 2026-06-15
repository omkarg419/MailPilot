import type { ReactNode } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Calendar03Icon,
  InboxIcon,
} from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { initials } from "@/components/mail/mail-utils";
import { ProfileGmailWatchButton } from "@/components/profile/profile-gmail-watch-button";

type ProfileViewProps = {
  userName: string;
  userEmail: string;
  userImage: string;
  gmailConnected: boolean;
  calendarConnected: boolean;
};

function ConnectionRow({
  icon,
  title,
  description,
  connected,
  connectHref,
  connectedAction,
}: {
  icon: typeof InboxIcon;
  title: string;
  description: string;
  connected: boolean;
  connectHref: string;
  connectedAction?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center bg-muted text-foreground">
          <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <Badge
          variant={connected ? "outline" : "destructive"}
          className={
            connected
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : undefined
          }
        >
          {connected ? "Connected" : "Not connected"}
        </Badge>
        {!connected ? (
          <Link
            href={connectHref}
            className={cn(buttonVariants({ variant: "outline", size: "xs" }))}
          >
            Connect
          </Link>
        ) : (
          connectedAction
        )}
      </div>
    </div>
  );
}

export function ProfileView({
  userName,
  userEmail,
  userImage,
  gmailConnected,
  calendarConnected,
}: ProfileViewProps) {
  return (
    <main className="min-h-svh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto w-full max-w-lg">
        <Link
          href="/mail"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mb-6 -ml-2 text-muted-foreground",
          )}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          Back to mail
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Your MailPilot account and connected services
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar size="lg">
                {userImage ? (
                  <AvatarImage src={userImage} alt={userName} />
                ) : null}
                <AvatarFallback className="text-sm font-semibold">
                  {initials(userName, userEmail)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-foreground">
                  {userName || "Signed in"}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-medium text-foreground">
                Connected services
              </h2>
              <ConnectionRow
                icon={InboxIcon}
                title="Gmail"
                description="Read, search, and send mail through MailPilot."
                connected={gmailConnected}
                connectHref="/api/corsair/connect?plugin=gmail"
                connectedAction={<ProfileGmailWatchButton />}
              />
              <ConnectionRow
                icon={Calendar03Icon}
                title="Google Calendar"
                description="View and manage calendar events."
                connected={calendarConnected}
                connectHref="/api/corsair/connect?plugin=googlecalendar"
              />
            </div>

            {!gmailConnected || !calendarConnected ? (
              <Link
                href="/connect"
                className={cn(buttonVariants({ variant: "default" }), "w-full")}
              >
                Manage connections
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
