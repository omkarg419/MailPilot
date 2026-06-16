"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  InboxIcon,
  MailSendIcon,
  StarsIcon,
} from "@hugeicons/core-free-icons";

import { LandingSection } from "@/components/landing/landing-section";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const WORKSPACES = [
  {
    id: "mail",
    title: "Mail",
    description: "Superhuman-style inbox with realtime Gmail sync.",
    icon: InboxIcon,
    slide: "left",
    mock: (
      <div className="space-y-2 p-3">
        {["Project update", "Meeting notes", "Invoice #2841"].map((subject, i) => (
          <div
            key={subject}
            className={cn(
              "rounded-[0.5rem] border border-border px-3 py-2.5",
              i === 0 ? "bg-muted/50" : "bg-background/50",
            )}
          >
            <div className="flex justify-between text-[11px]">
              <span className="font-medium text-foreground">Sender {i + 1}</span>
              <span className="text-muted-foreground">2:4{i} PM</span>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {subject}
            </p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "calendar",
    title: "Calendar",
    description: "Week grid with conflicts, events, and live updates.",
    icon: Calendar03Icon,
    slide: "up",
    mock: (
      <div className="grid grid-cols-7 gap-px bg-border p-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="space-y-1 bg-card p-1">
            <div className="h-1.5 w-full rounded-sm bg-muted" />
            {i === 2 ? (
              <div className="rounded-[0.35rem] bg-primary/20 px-1 py-2 text-[8px] text-foreground">
                Team sync
              </div>
            ) : i === 4 ? (
              <div className="rounded-[0.35rem] bg-muted px-1 py-2 text-[8px] text-muted-foreground">
                Lunch
              </div>
            ) : null}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "agent",
    title: "Agent",
    description: "ChatGPT-style assistant for mail and calendar tasks.",
    icon: StarsIcon,
    slide: "right",
    mock: (
      <div className="space-y-3 p-4">
        <div className="ml-auto max-w-[80%] rounded-[0.75rem] bg-primary px-3 py-2 text-[11px] text-primary-foreground">
          Book a meeting tomorrow
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <HugeiconsIcon icon={MailSendIcon} strokeWidth={2} className="size-3" />
          Drafting confirmation…
        </div>
        <div className="rounded-[0.5rem] border border-border bg-muted/30 px-3 py-2 text-[10px] text-foreground">
          Event created · Email ready to send
        </div>
      </div>
    ),
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
      <div className="min-h-[180px] flex-1 bg-muted/15">{workspace.mock}</div>
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

      <div
        ref={ref}
        className="mt-14 grid gap-6 md:grid-cols-3"
      >
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
