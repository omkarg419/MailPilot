import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileView } from "@/components/profile/profile-view";
import { auth } from "@/server/auth";
import { getConnectionFlags } from "@/server/corsair";

export const metadata: Metadata = {
  title: "Profile — MailPilot",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const { gmail, calendar } = await getConnectionFlags(session.user.id);

  return (
    <ProfileView
      userName={session.user.name ?? ""}
      userEmail={session.user.email ?? ""}
      userImage={session.user.image ?? ""}
      gmailConnected={gmail}
      calendarConnected={calendar}
    />
  );
}
