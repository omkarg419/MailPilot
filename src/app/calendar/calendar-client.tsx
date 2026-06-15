"use client";

import { useRouter } from "next/navigation";

import { CalendarWeekView } from "@/components/calendar/calendar-week-view";
import { MailSidebar } from "@/components/mail/mail-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

type CalendarClientProps = {
  userEmail: string;
  userName: string;
  userImage: string;
  calendarConnected: boolean;
};

export function CalendarClient({
  userEmail,
  userName,
  userImage,
  calendarConnected,
}: CalendarClientProps) {
  const router = useRouter();

  return (
    <SidebarProvider className="flex h-svh w-full overflow-hidden bg-background text-foreground">
      <MailSidebar
        activeWorkspace="calendar"
        activeLabel="INBOX"
        onLabelChange={() => router.push("/mail")}
        onCompose={() => router.push("/mail")}
        userEmail={userEmail}
        userName={userName}
        userImage={userImage}
      />

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <CalendarWeekView calendarConnected={calendarConnected} />
      </div>
    </SidebarProvider>
  );
}
