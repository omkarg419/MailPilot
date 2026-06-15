import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { CalendarClient } from "@/app/calendar/calendar-client";
import { auth } from "@/server/auth";
import { getConnectionFlags } from "@/server/corsair";

export const metadata: Metadata = {
  title: "Calendar — MailPilot",
};

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const { calendar } = await getConnectionFlags(session.user.id);

  return (
    <CalendarClient
      userEmail={session.user.email ?? ""}
      userName={session.user.name ?? ""}
      userImage={session.user.image ?? ""}
      calendarConnected={calendar}
    />
  );
}
