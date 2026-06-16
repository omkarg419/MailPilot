"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown02Icon,
  Calendar03Icon,
  MailSend01Icon,
  SearchIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import { LandingSection } from "@/components/landing/landing-section";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const FLOW_STEPS = [
  {
    label: "Check availability",
    icon: SearchIcon,
  },
  {
    label: "Create calendar event",
    icon: Calendar03Icon,
  },
  {
    label: "Draft email",
    icon: MailSend01Icon,
  },
  {
    label: "Ready to send",
    icon: Tick02Icon,
  },
] as const;

export function LandingWorkflow() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <LandingSection>
      <div className="text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          One request. Multiple actions.
        </h2>
      </div>

      <div ref={ref} className="mx-auto mt-14 max-w-lg">
        <div className="rounded-[0.75rem] border border-border bg-card px-5 py-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            You
          </p>
          <p className="mt-2 text-base text-foreground">
            Book a meeting with Sarah tomorrow and send a confirmation email.
          </p>
        </div>

        <div className="flex justify-center py-3 text-muted-foreground">
          <HugeiconsIcon icon={ArrowDown02Icon} strokeWidth={2} className="size-5" />
        </div>

        <div className="space-y-0">
          {FLOW_STEPS.map((step, index) => (
            <div key={step.label}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-[0.75rem] border border-border bg-muted/20 px-5 py-4 transition-all duration-500",
                  inView
                    ? "translate-y-0 opacity-100"
                    : "translate-y-6 opacity-0",
                )}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="flex size-8 items-center justify-center rounded-[0.5rem] border border-border bg-background">
                  <HugeiconsIcon
                    icon={step.icon}
                    strokeWidth={2}
                    className="size-4 text-primary"
                  />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {step.label}
                </span>
              </div>
              {index < FLOW_STEPS.length - 1 ? (
                <div className="flex justify-center py-2 text-muted-foreground/60">
                  <HugeiconsIcon
                    icon={ArrowDown02Icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
