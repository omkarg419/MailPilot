import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { ProfileView } from "@/components/profile/profile-view";
import { auth } from "@/server/auth";
import { getConnectionFlags } from "@/server/corsair";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

export const metadata: Metadata = {
  title: "Profile — MailPilot",
};

function formatJoinedLabel(date: Date | null | undefined): string {
  if (!date) return "Joined recently";
  return `Joined ${date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })}`;
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const [{ gmail, calendar }, dbUser] = await Promise.all([
    getConnectionFlags(session.user.id),
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { emailVerified: true },
    }),
  ]);

  return (
    <ProfileView
      userName={session.user.name ?? ""}
      userEmail={session.user.email ?? ""}
      userImage={session.user.image ?? ""}
      joinedLabel={formatJoinedLabel(dbUser?.emailVerified)}
      gmailConnected={gmail}
      calendarConnected={calendar}
    />
  );
}
