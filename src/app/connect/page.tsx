import { redirect } from "next/navigation";

import { ConnectView } from "@/components/connect/connect-view";
import { auth } from "@/server/auth";
import { getConnectionFlags } from "@/server/corsair";

export default async function ConnectPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const { gmail, calendar } = await getConnectionFlags(session.user.id);
  if (gmail && calendar) {
    redirect("/agent");
  }

  return (
    <ConnectView
      userEmail={session.user.email ?? ""}
      userName={session.user.name ?? ""}
      gmailConnected={gmail}
      calendarConnected={calendar}
    />
  );
}
