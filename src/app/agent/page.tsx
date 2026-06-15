import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { AgentClient } from "@/app/agent/agent-client";
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
    <AgentClient
      userEmail={session.user.email ?? ""}
      userName={session.user.name ?? ""}
      userImage={session.user.image ?? ""}
    />
  );
}
