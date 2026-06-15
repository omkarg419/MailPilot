import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { CalendarClientLoader } from "@/app/calendar/calendar-client-loader";
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
    <CalendarClientLoader
      userEmail={session.user.email ?? ""}
      userName={session.user.name ?? ""}
      userImage={session.user.image ?? ""}
      calendarConnected={calendar}
    />
  );
}
