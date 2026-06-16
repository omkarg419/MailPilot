"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUp02Icon,
  Calendar03Icon,
  Clock01Icon,
  Delete02Icon,
  InboxIcon,
  MailEditIcon,
  MailReplyIcon,
  MailSend01Icon,
  MailSendIcon,
  PencilEdit01Icon,
  SearchIcon,
  SpamIcon,
  StarsIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

import { MailPilotLogoMark } from "@/components/mail/mail-pilot-logo-mark";
import { cn } from "@/lib/utils";

const MAIL_THREADS = [
  {
    from: "Sarah Chen",
    subject: "Q3 planning sync",
    snippet: "Can we align on priorities before…",
    unread: true,
    selected: true,
  },
  {
    from: "Rahul Mehta",
    subject: "Lunch next week?",
    snippet: "Are you free Tuesday around noon…",
    unread: true,
    selected: false,
  },
  {
    from: "Notion Team",
    subject: "Your weekly digest",
    snippet: "Updates from your workspace…",
    unread: false,
    selected: false,
  },
] as const;

export function MailWorkspaceMock() {
  return (
    <div className="flex h-[220px] overflow-hidden bg-background text-[8px] leading-tight select-none">
      {/* Sidebar — matches mail-sidebar.tsx */}
      <aside className="flex w-[26%] shrink-0 flex-col border-r border-white/[0.06] bg-sidebar">
        <div className="space-y-2 border-b border-white/[0.06] px-2 py-2">
          <div className="flex items-center gap-1 px-0.5">
            <MailPilotLogoMark className="h-3 w-auto" />
            <span className="truncate text-[9px] font-bold text-sidebar-foreground">
              MailPilot
            </span>
          </div>
          <div className="flex h-5 items-center gap-1 rounded-[0.35rem] bg-white/[0.06] px-1.5 text-[7px] font-medium text-sidebar-foreground">
            <HugeiconsIcon
              icon={PencilEdit01Icon}
              strokeWidth={2}
              className="size-2 shrink-0 text-sidebar-primary"
            />
            <span className="flex-1 truncate">Compose</span>
          </div>
        </div>
        <div className="flex-1 space-y-2 overflow-hidden px-1.5 py-2">
          <p className="px-1 text-[6px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/55">
            Workspace
          </p>
          <div className="space-y-0.5">
            <div className="flex h-4 items-center gap-1 rounded-[0.3rem] bg-white/[0.08] px-1.5 text-[7px] font-medium text-sidebar-foreground">
              <HugeiconsIcon icon={InboxIcon} strokeWidth={2} className="size-2" />
              Inbox
            </div>
            <div className="flex h-4 items-center gap-1 rounded-[0.3rem] px-1.5 text-[7px] text-sidebar-foreground/90">
              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-2" />
              Calendar
            </div>
            <div className="flex h-4 items-center gap-1 rounded-[0.3rem] px-1.5 text-[7px] text-sidebar-foreground/90">
              <HugeiconsIcon icon={StarsIcon} strokeWidth={2} className="size-2" />
              Agent
            </div>
          </div>
          <p className="px-1 pt-1 text-[6px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/55">
            Mail
          </p>
          <div className="space-y-0.5">
            {[
              { label: "Sent", icon: MailSendIcon },
              { label: "Drafts", icon: MailEditIcon },
              { label: "Spam", icon: SpamIcon },
            ].map(({ label, icon }) => (
              <div
                key={label}
                className="flex h-3.5 items-center gap-1 rounded-[0.3rem] px-1.5 text-[7px] text-sidebar-foreground/80"
              >
                <HugeiconsIcon icon={icon} strokeWidth={2} className="size-2" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Thread list — matches thread-list.tsx */}
      <div className="flex w-[34%] shrink-0 flex-col border-r border-border bg-background">
        <div className="space-y-1 border-b border-border px-2 py-1.5">
          <p className="text-[8px] font-medium text-foreground">Inbox</p>
          <div className="flex h-4 items-center gap-1 rounded-[0.25rem] border border-border bg-background px-1.5">
            <HugeiconsIcon
              icon={SearchIcon}
              strokeWidth={2}
              className="size-2 text-muted-foreground"
            />
            <span className="text-[7px] text-muted-foreground">Search mail</span>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {MAIL_THREADS.map((thread) => (
            <div
              key={thread.subject}
              className={cn(
                "border-b border-border px-2 py-1.5",
                thread.selected ? "bg-accent" : "bg-background",
              )}
            >
              <div className="flex justify-between gap-1">
                <span
                  className={cn(
                    "truncate text-[7px]",
                    thread.unread
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {thread.from}
                </span>
                <span className="shrink-0 text-[6px] text-muted-foreground">
                  2:41 PM
                </span>
              </div>
              <p
                className={cn(
                  "truncate text-[7px]",
                  thread.unread ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {thread.subject}
              </p>
              <p className="truncate text-[6px] text-muted-foreground">
                {thread.snippet}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Thread view — matches thread-view.tsx */}
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-1.5">
          <h2 className="min-w-0 flex-1 truncate text-[8px] font-semibold text-foreground">
            Q3 planning sync
          </h2>
          <div className="flex shrink-0 gap-0.5">
            <span className="flex h-4 items-center gap-0.5 rounded-[0.25rem] border border-border/70 bg-muted px-1 text-[6px] text-foreground">
              <HugeiconsIcon icon={MailReplyIcon} strokeWidth={2} className="size-2" />
              Reply
            </span>
            <span className="flex h-4 items-center gap-0.5 rounded-[0.25rem] border border-destructive/60 bg-destructive px-1 text-[6px] text-white">
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-2" />
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-hidden p-2">
          <div className="rounded-[0.35rem] border border-border bg-card ring-1 ring-foreground/10">
            <div className="flex items-start gap-1.5 border-b border-border px-2 py-1.5">
              <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[6px] font-semibold">
                SC
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-1">
                  <span className="truncate text-[7px] font-medium text-foreground">
                    Sarah Chen
                  </span>
                  <span className="text-[6px] text-muted-foreground">Mon</span>
                </div>
                <p className="truncate text-[6px] text-muted-foreground">to me</p>
              </div>
            </div>
            <div className="px-2 py-1.5 text-[7px] leading-relaxed text-foreground">
              Hi — can we align on Q3 priorities before Thursday&apos;s sync?
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CAL_DAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const CAL_DATES = [16, 17, 18, 19, 20, 21, 22];

export function CalendarWorkspaceMock() {
  return (
    <div className="flex h-[220px] flex-col overflow-hidden bg-background text-[8px] leading-tight select-none">
      {/* Toolbar — matches calendar-week-view header */}
      <header className="flex shrink-0 items-center justify-between gap-1 border-b border-border px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          <span className="rounded-[0.3rem] border border-border px-1.5 py-0.5 text-[6px] font-medium uppercase text-foreground">
            Today
          </span>
          <span className="text-[7px] font-semibold text-foreground">June 2026</span>
        </div>
        <span className="flex h-4 items-center gap-0.5 rounded-[0.35rem] bg-primary px-1.5 text-[6px] text-primary-foreground">
          <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-2" />
          New event
        </span>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Week time grid — simplified calendar-time-grid.tsx */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="grid shrink-0 border-b border-border [grid-template-columns:1.25rem_repeat(7,minmax(0,1fr))]">
            <div className="border-r border-border" />
            {CAL_DAYS.map((day, i) => (
              <div
                key={`${day}-${i}`}
                className={cn(
                  "flex flex-col items-center border-r border-border py-1 last:border-r-0",
                  i === 2 && "bg-primary/5",
                )}
              >
                <span className="text-[6px] text-muted-foreground">{day}</span>
                <span
                  className={cn(
                    "mt-0.5 flex size-3.5 items-center justify-center rounded-[0.25rem] text-[7px] font-medium",
                    i === 2
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground",
                  )}
                >
                  {CAL_DATES[i]}
                </span>
              </div>
            ))}
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div className="grid h-full [grid-template-columns:1.25rem_repeat(7,minmax(0,1fr))]">
              <div className="border-r border-border py-1">
                {["9 AM", "12 PM", "3 PM"].map((h) => (
                  <div
                    key={h}
                    className="flex h-8 items-start justify-end pr-0.5 text-[5px] text-muted-foreground"
                  >
                    {h}
                  </div>
                ))}
              </div>
              {CAL_DAYS.map((_, col) => (
                <div
                  key={col}
                  className="relative border-r border-border last:border-r-0"
                >
                  <div className="absolute inset-0">
                    {[0, 1, 2].map((row) => (
                      <div
                        key={row}
                        className="h-8 border-b border-border/50"
                      />
                    ))}
                  </div>
                  {col === 2 && (
                    <div className="absolute top-6 left-0.5 right-0.5 z-10 rounded-[0.25rem] border border-primary/35 bg-primary/20 px-0.5 py-0.5 ring-1 ring-primary/20">
                      <p className="truncate text-[5px] font-semibold text-foreground">
                        Team sync
                      </p>
                      <p className="truncate text-[5px] text-muted-foreground">
                        10:00 – 11:00
                      </p>
                    </div>
                  )}
                  {col === 4 && (
                    <div className="absolute top-14 left-0.5 right-0.5 z-10 rounded-[0.25rem] border border-primary/35 bg-primary/20 px-0.5 py-0.5 ring-1 ring-primary/20">
                      <p className="truncate text-[5px] font-semibold text-foreground">
                        Lunch
                      </p>
                      <p className="truncate text-[5px] text-muted-foreground">
                        12:30 – 1:30
                      </p>
                    </div>
                  )}
                  {col === 2 && (
                    <div className="absolute top-10 left-0 right-0 z-[5] h-px bg-primary/70" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side panel — matches calendar-side-panel.tsx */}
        <aside className="flex w-[28%] shrink-0 flex-col border-l border-border bg-background">
          <div className="border-b border-border p-1.5">
            <div className="grid grid-cols-7 gap-px text-center text-[5px] text-muted-foreground">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <span key={`${d}-${i}`}>{d}</span>
              ))}
            </div>
            <div className="mt-0.5 grid grid-cols-7 gap-px text-center">
              {Array.from({ length: 14 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "flex size-2.5 items-center justify-center rounded-[0.15rem] text-[5px]",
                    i === 10
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {i + 8}
                </span>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden p-1.5">
            <p className="text-[7px] font-medium text-foreground">Today</p>
            <div className="mt-1 space-y-1">
              <button
                type="button"
                className="w-full rounded-[0.3rem] border border-primary/40 bg-primary/10 px-1 py-1 text-left"
              >
                <div className="flex items-center gap-0.5">
                  <HugeiconsIcon
                    icon={Clock01Icon}
                    strokeWidth={2}
                    className="size-2 text-primary"
                  />
                  <span className="truncate text-[6px] font-medium text-foreground">
                    Team sync
                  </span>
                </div>
                <p className="mt-0.5 pl-2.5 text-[5px] text-muted-foreground">
                  10:00 AM
                </p>
              </button>
              <div className="rounded-[0.3rem] px-1 py-1 opacity-60">
                <div className="flex items-center gap-0.5 text-muted-foreground">
                  <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-2" />
                  <span className="truncate text-[6px]">Standup</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function AgentWorkspaceMock() {
  return (
    <div className="flex h-[220px] flex-col overflow-hidden bg-background text-[8px] leading-tight select-none">
      <div className="min-h-0 flex-1 overflow-hidden px-2 py-2">
        {/* User bubble — agent-chat.tsx */}
        <div className="flex justify-end">
          <div className="max-w-[75%] rounded-[0.65rem] bg-primary px-2 py-1 text-[7px] text-primary-foreground">
            Schedule lunch with Rahul next week
          </div>
        </div>

        <p className="mt-2 text-[7px] text-foreground">
          I found a slot and drafted a confirmation for you.
        </p>

        {/* Calendar block — agent-calendar-block.tsx */}
        <div className="mt-2 max-w-[85%] rounded-[0.35rem] border border-border bg-card ring-1 ring-foreground/10">
          <div className="flex items-start justify-between gap-1 border-b border-border px-2 py-1.5">
            <div className="flex items-center gap-1">
              <HugeiconsIcon
                icon={Calendar03Icon}
                strokeWidth={2}
                className="size-2.5 text-primary"
              />
              <span className="text-[7px] font-semibold text-foreground">
                Lunch with Rahul
              </span>
            </div>
            <span className="rounded-[0.2rem] bg-primary/10 px-1 py-px text-[5px] text-primary">
              Proposed
            </span>
          </div>
          <div className="space-y-1 px-2 py-1.5 text-[6px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-2" />
              Tue, Jun 24 · 12:30 – 1:30 PM
            </div>
            <div className="flex items-center gap-1">
              <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-2" />
              rahul@example.com
            </div>
          </div>
          <div className="flex gap-1 border-t border-border px-2 py-1.5">
            <span className="rounded-[0.25rem] bg-primary px-1.5 py-0.5 text-[6px] text-primary-foreground">
              Book Event
            </span>
            <span className="rounded-[0.25rem] border border-border px-1.5 py-0.5 text-[6px] text-foreground">
              Cancel
            </span>
          </div>
        </div>

        {/* Compose block — agent-compose-block.tsx */}
        <div className="mt-1.5 max-w-[85%] rounded-[0.35rem] border border-border bg-card ring-1 ring-foreground/10">
          <div className="border-b border-border px-2 py-1">
            <div className="flex items-center gap-1 text-[7px] font-semibold text-foreground">
              <HugeiconsIcon icon={MailSend01Icon} strokeWidth={2} className="size-2.5" />
              Confirmation email
            </div>
          </div>
          <div className="space-y-0.5 px-2 py-1 text-[6px] text-muted-foreground">
            <p>
              <span className="text-foreground">To:</span> rahul@example.com
            </p>
            <p>
              <span className="text-foreground">Subject:</span> Lunch next week
            </p>
            <p className="line-clamp-2 text-foreground">
              Hi Rahul, looking forward to lunch on Tuesday…
            </p>
          </div>
          <div className="flex gap-1 border-t border-border px-2 py-1">
            <span className="rounded-[0.25rem] bg-primary px-1.5 py-0.5 text-[6px] text-primary-foreground">
              Send
            </span>
            <span className="rounded-[0.25rem] border border-border px-1.5 py-0.5 text-[6px]">
              Save draft
            </span>
          </div>
        </div>
      </div>

      {/* Input — agent-chat AgentInputArea */}
      <div className="shrink-0 border-t border-border/50 bg-background/80 px-2 py-1.5">
        <div className="relative">
          <div className="flex h-5 items-center rounded-full border border-border bg-background py-1 pr-5 pl-2 text-[6px] text-muted-foreground shadow-sm">
            Ask MailPilot Agent…
          </div>
          <div className="absolute right-0.5 bottom-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <HugeiconsIcon icon={ArrowUp02Icon} strokeWidth={2} className="size-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
