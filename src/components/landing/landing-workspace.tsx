"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  InboxIcon,
  StarsIcon,
} from "@hugeicons/core-free-icons";

import { LandingSection } from "@/components/landing/landing-section";
import {
  AgentWorkspaceMock,
  CalendarWorkspaceMock,
  MailWorkspaceMock,
} from "@/components/landing/landing-workspace-mocks";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const WORKSPACES = [
  {
    id: "mail",
    title: "Mail",
    description: "Superhuman-style inbox with realtime Gmail sync.",
    icon: InboxIcon,
    slide: "left" as const,
    Mock: MailWorkspaceMock,
  },
  {
    id: "calendar",
    title: "Calendar",
    description: "Week grid with conflicts, events, and live updates.",
    icon: Calendar03Icon,
    slide: "up" as const,
    Mock: CalendarWorkspaceMock,
  },
  {
    id: "agent",
    title: "Agent",
    description: "ChatGPT-style assistant for mail and calendar tasks.",
    icon: StarsIcon,
    slide: "right" as const,
    Mock: AgentWorkspaceMock,
  },
] as const;

function WorkspaceCard({
  workspace,
  index,
  inView,
}: {
  workspace: (typeof WORKSPACES)[number];
  index: number;
  inView: boolean;
}) {
  const { Mock } = workspace;

  const slideClass =
    workspace.slide === "left"
      ? inView
        ? "translate-x-0"
        : "-translate-x-12"
      : workspace.slide === "right"
        ? inView
          ? "translate-x-0"
          : "translate-x-12"
        : inView
          ? "translate-y-0"
          : "translate-y-12";

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-[0.75rem] border border-border bg-card transition-all duration-700 ease-out",
        slideClass,
        inView ? "opacity-100" : "opacity-0",
      )}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={workspace.icon}
            strokeWidth={2}
            className="size-4 text-primary"
          />
          <h3 className="text-lg font-semibold text-foreground">
            {workspace.title}
          </h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {workspace.description}
        </p>
      </div>
      <div className="overflow-hidden border-t border-border/50 bg-muted/10">
        <Mock />
      </div>
    </article>
  );
}

export function LandingWorkspace() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <LandingSection className="bg-muted/15">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Unified workspace
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Mail, Calendar, and Agent — together
        </h2>
      </div>

      <div ref={ref} className="mt-14 grid gap-6 md:grid-cols-3">
        {WORKSPACES.map((workspace, index) => (
          <WorkspaceCard
            key={workspace.id}
            workspace={workspace}
            index={index}
            inView={inView}
          />
        ))}
      </div>
    </LandingSection>
  );
}
