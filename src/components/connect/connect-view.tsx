import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  InboxIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ConnectCardProps = {
  icon: typeof InboxIcon;
  title: string;
  description: string;
  href: string;
  connected: boolean;
};

function ConnectCard({
  icon,
  title,
  description,
  href,
  connected,
}: ConnectCardProps) {
  return (
    <div className="flex flex-col gap-4 border border-border bg-card p-6 transition-colors hover:border-muted-foreground/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center bg-muted text-foreground">
            <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        {connected ? (
          <Badge
            variant="outline"
            className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          >
            <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3" />
            Connected
          </Badge>
        ) : null}
      </div>

      {connected ? (
        <span
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-fit cursor-default opacity-60",
          )}
        >
          Done
        </span>
      ) : (
        <Link href={href} className={cn(buttonVariants(), "w-fit")}>
          Connect
        </Link>
      )}
    </div>
  );
}

type ConnectViewProps = {
  userEmail: string;
  userName: string;
  gmailConnected: boolean;
  calendarConnected: boolean;
};

export function ConnectView({
  userEmail,
  userName,
  gmailConnected,
  calendarConnected,
}: ConnectViewProps) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12 text-foreground">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Connect your accounts
          </CardTitle>
          <CardDescription>
            MailPilot needs access to your Gmail and Google Calendar to get
            started. Connect both to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ConnectCard
            icon={InboxIcon}
            title="Connect Gmail"
            description="Let MailPilot read, triage, and draft replies in your inbox."
            href="/api/corsair/connect?plugin=gmail"
            connected={gmailConnected}
          />
          <ConnectCard
            icon={Calendar03Icon}
            title="Connect Calendar"
            description="Let MailPilot view and schedule events on your Google Calendar."
            href="/api/corsair/connect?plugin=googlecalendar"
            connected={calendarConnected}
          />
          <p className="pt-2 text-center text-xs text-muted-foreground">
            Signed in as {userEmail || userName}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
