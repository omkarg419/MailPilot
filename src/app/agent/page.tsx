import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { AgentClientLoader } from "@/app/agent/agent-client-loader";
import { auth } from "@/server/auth";

export const metadata: Metadata = {
  title: "Agent — MailPilot",
};

export default async function AgentPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <AgentClientLoader
      userEmail={session.user.email ?? ""}
      userName={session.user.name ?? ""}
      userImage={session.user.image ?? ""}
    />
  );
}
