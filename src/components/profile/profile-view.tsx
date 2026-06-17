"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  InboxIcon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MailSidebar } from "@/components/mail/mail-sidebar";
import { initials } from "@/components/mail/mail-utils";
import { ProfileAgentAccessPanel } from "@/components/profile/profile-agent-access";
import { ProfileCalendarWatchButton } from "@/components/profile/profile-calendar-watch-button";
import { ProfileConnectedServiceRow } from "@/components/profile/profile-connected-service-row";
import { ProfileGmailWatchButton } from "@/components/profile/profile-gmail-watch-button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useInboxNewCount, useMailRealtimeConnection } from "@/hooks/use-mail-realtime";
import { fetchAndSyncListThreads } from "@/lib/mail-list-cache";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

type ProfileViewProps = {
  userName: string;
  userEmail: string;
  userImage: string;
  joinedLabel: string;
  gmailConnected: boolean;
  calendarConnected: boolean;
};

function ProfileInfoBadge({
  icon,
  children,
}: {
  icon: typeof Calendar03Icon;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[0.5rem]",
        "border border-white/8 bg-white/[0.04] px-2.5 py-1",
        "text-xs text-muted-foreground",
      )}
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5 shrink-0" />
      {children}
    </span>
  );
}

export function ProfileView({
  userName,
  userEmail,
  userImage,
  joinedLabel,
  gmailConnected,
  calendarConnected,
}: ProfileViewProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const fetchInboxThreads = useCallback(async () => {
    const data = await fetchAndSyncListThreads(utils.gmail.listThreads, "INBOX");
    return data.threads;
  }, [utils]);

  const inboxNewCount = useInboxNewCount(false, fetchInboxThreads);
  useMailRealtimeConnection();

  return (
    <SidebarProvider className="flex h-svh w-full overflow-hidden bg-background text-foreground">
      <MailSidebar
        activeWorkspace="mail"
        activeLabel="INBOX"
        onLabelChange={() => router.push("/mail")}
        onCompose={() => router.push("/mail")}
        userEmail={userEmail}
        userName={userName}
        userImage={userImage}
        inboxNewCount={inboxNewCount}
      />

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-background">
        <div className="mx-auto w-full max-w-4xl px-6 py-8 md:px-10 md:py-10">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Profile
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your account and connected services
            </p>
          </header>

          <section
            className={cn(
              "mb-8 rounded-[1rem] border border-white/8",
              "bg-[linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]",
              "p-6 shadow-sm md:p-7",
            )}
          >
            <div className="flex min-w-0 flex-1 gap-5">
                <Avatar className="size-24 shrink-0 md:size-28">
                  {userImage ? (
                    <AvatarImage src={userImage} alt={userName} />
                  ) : null}
                  <AvatarFallback className="text-lg font-semibold">
                    {initials(userName, userEmail)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 pt-1">
                  <p className="truncate text-2xl font-bold text-foreground">
                    {userName || "Signed in"}
                  </p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {userEmail}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ProfileInfoBadge icon={Calendar03Icon}>
                      {joinedLabel}
                    </ProfileInfoBadge>
                    <ProfileInfoBadge icon={SecurityCheckIcon}>
                      Account type Personal
                    </ProfileInfoBadge>
                  </div>
                </div>
              </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Connected services
            </h2>

            <div
              className={cn(
                "overflow-hidden rounded-[1rem] border border-white/8",
                "bg-[linear-gradient(145deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]",
              )}
            >
              <ProfileConnectedServiceRow
                icon={InboxIcon}
                title="Gmail"
                description="Read, search, and send mail through MailPilot."
                connected={gmailConnected}
                connectHref="/api/corsair/connect?plugin=gmail"
                connectedAction={
                  gmailConnected ? <ProfileGmailWatchButton /> : undefined
                }
              />

              <div className="mx-6 border-t border-white/8" />

              <ProfileConnectedServiceRow
                icon={Calendar03Icon}
                title="Google Calendar"
                description="View and manage calendar events."
                connected={calendarConnected}
                connectHref="/api/corsair/connect?plugin=googlecalendar"
                connectedAction={
                  calendarConnected ? (
                    <ProfileCalendarWatchButton />
                  ) : undefined
                }
              />
            </div>
          </section>

          <ProfileAgentAccessPanel />
        </div>
      </div>
    </SidebarProvider>
  );
}
