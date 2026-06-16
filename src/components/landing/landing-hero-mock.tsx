"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp02Icon } from "@hugeicons/core-free-icons";

import { useTypewriter } from "@/hooks/use-typewriter";
import { cn } from "@/lib/utils";

const HERO_SUGGESTIONS = [
  "What's on my calendar today?",
  "Draft email to Rahul",
  "Schedule a meeting",
] as const;

const TYPEWRITER_PHRASES = [
  "What's on my calendar today?",
  "Draft email to Rahul about the project",
  "Schedule a meeting with Sarah tomorrow",
] as const;

export function HeroAgentMock() {
  const typed = useTypewriter(TYPEWRITER_PHRASES);

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div
        aria-hidden
        className="landing-glow pointer-events-none absolute -inset-8 rounded-[1.5rem] opacity-60"
      />
      <div className="relative overflow-hidden rounded-[1rem] border border-border bg-card shadow-2xl shadow-black/20">
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-muted-foreground/25" />
            <span className="size-2.5 rounded-full bg-muted-foreground/25" />
            <span className="size-2.5 rounded-full bg-muted-foreground/25" />
          </div>
          <span className="ml-2 text-[11px] text-muted-foreground">
            MailPilot Agent
          </span>
        </div>

        <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-10 sm:min-h-[360px]">
          <div className="mb-8 text-center">
            <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Hey there, Omkar
            </h3>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              What can I help you with today?
            </p>
          </div>

          <div className="w-full max-w-md">
            <div className="relative">
              <div
                className={cn(
                  "flex min-h-12 items-center rounded-full border border-border bg-background py-3 pr-14 pl-4 text-[15px] shadow-sm",
                )}
              >
                <span className="truncate text-foreground">{typed}</span>
                <span className="landing-cursor ml-px inline-block h-[1.1em] w-px bg-foreground" />
              </div>
              <div className="absolute right-2 bottom-2 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <HugeiconsIcon icon={ArrowUp02Icon} strokeWidth={2} className="size-4" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {HERO_SUGGESTIONS.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-border bg-muted/30 px-3.5 py-1.5 text-xs text-muted-foreground"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
