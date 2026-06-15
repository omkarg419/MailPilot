"use client";

import dynamic from "next/dynamic";

import { useMailRealtimeConnection } from "@/hooks/use-mail-realtime";

const CalendarClient = dynamic(
  () => import("@/app/calendar/calendar-client").then((mod) => mod.CalendarClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-svh w-full items-center justify-center bg-background text-muted-foreground">
        Loading calendar…
      </div>
    ),
  },
);

type CalendarClientLoaderProps = {
  userEmail: string;
  userName: string;
  userImage: string;
  calendarConnected: boolean;
};

export function CalendarClientLoader(props: CalendarClientLoaderProps) {
  useMailRealtimeConnection();
  return <CalendarClient {...props} />;
}
