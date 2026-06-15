"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { AgentChat } from "@/components/agent/agent-chat";
import { MailSidebar } from "@/components/mail/mail-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useInboxNewCount, useMailRealtimeConnection } from "@/hooks/use-mail-realtime";
import { api } from "@/trpc/react";

type AgentClientProps = {
  userEmail: string;
  userName: string;
  userImage: string;
};

export function AgentClient({
  userEmail,
  userName,
  userImage,
}: AgentClientProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const fetchInboxThreads = useCallback(async () => {
    const data = await utils.gmail.listThreads.fetch({
      label: "INBOX",
      refresh: true,
    });
    return data.threads;
  }, [utils]);

  const inboxNewCount = useInboxNewCount(false, fetchInboxThreads);

  useMailRealtimeConnection();

  return (
    <SidebarProvider className="flex h-svh w-full overflow-hidden bg-background text-foreground">
      <MailSidebar
        activeWorkspace="agent"
        activeLabel="INBOX"
        onLabelChange={() => router.push("/mail")}
        onCompose={() => router.push("/mail")}
        userEmail={userEmail}
        userName={userName}
        userImage={userImage}
        inboxNewCount={inboxNewCount}
      />

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AgentChat userName={userName} userEmail={userEmail} />
      </div>
    </SidebarProvider>
  );
}
