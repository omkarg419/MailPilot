"use client";

import dynamic from "next/dynamic";

import { useMailRealtimeConnection } from "@/hooks/use-mail-realtime";

const AgentClient = dynamic(
  () => import("@/app/agent/agent-client").then((mod) => mod.AgentClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-svh w-full items-center justify-center bg-background text-muted-foreground">
        Loading agent…
      </div>
    ),
  },
);

type AgentClientLoaderProps = {
  userEmail: string;
  userName: string;
  userImage: string;
};

export function AgentClientLoader(props: AgentClientLoaderProps) {
  useMailRealtimeConnection();
  return <AgentClient {...props} />;
}
