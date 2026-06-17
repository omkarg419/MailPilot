"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Calendar03Icon,
  MailSend01Icon,
  SearchIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import type { ComponentType } from "react";

import { LandingSection } from "@/components/landing/landing-section";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

type WorkflowStep = {
  label: string;
  icon: typeof SearchIcon;
  final?: boolean;
};

const FLOW_STEPS: WorkflowStep[] = [
  { label: "Check availability", icon: SearchIcon },
  { label: "Create calendar event", icon: Calendar03Icon },
  { label: "Draft email", icon: MailSend01Icon },
  { label: "Ready to send", icon: Tick02Icon, final: true },
];

const workflowCardClass = cn(
  "w-full rounded-[0.75rem] border border-border/80 bg-card/95 px-5 py-4",
  "shadow-[0_0_24px_color-mix(in_oklch,var(--primary)_10%,transparent)]",
  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
);

function PathNode({ cx, cy, active }: { cx: number; cy: number; active: boolean }) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="var(--primary)"
      filter="url(#workflow-glow)"
      className={cn("transition-opacity duration-700", active ? "opacity-100" : "opacity-35")}
    />
  );
}

function ConnectorYouToFirst({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 320 72"
      className="mx-auto block h-16 w-full max-w-lg"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d="M 160 0 L 160 26 C 160 38, 246 48, 292 72"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        filter="url(#workflow-glow)"
        className={cn("transition-opacity duration-700", active ? "opacity-100" : "opacity-35")}
      />
      <PathNode cx={160} cy={14} active={active} />
      <PathNode cx={246} cy={52} active={active} />
    </svg>
  );
}

/** Exit left → semicircle left → enter left */
function ConnectorFirstToSecond({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="-16 0 352 72"
      className="mx-auto block h-16 w-full max-w-lg"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d="M 28 0 C 28 22, -6 36, 28 50 C 28 60, 28 66, 28 72"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        filter="url(#workflow-glow)"
        className={cn("transition-opacity duration-700", active ? "opacity-100" : "opacity-35")}
      />
      <PathNode cx={28} cy={12} active={active} />
      <PathNode cx={4} cy={36} active={active} />
    </svg>
  );
}

/** Exit right → semicircle right → enter right */
function ConnectorSecondToThird({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="-16 0 352 72"
      className="mx-auto block h-16 w-full max-w-lg"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d="M 292 0 C 292 22, 326 36, 292 50 C 292 60, 292 66, 292 72"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        filter="url(#workflow-glow)"
        className={cn("transition-opacity duration-700", active ? "opacity-100" : "opacity-35")}
      />
      <PathNode cx={292} cy={12} active={active} />
      <PathNode cx={316} cy={36} active={active} />
    </svg>
  );
}

/** Exit left → semicircle left → enter left */
function ConnectorThirdToFourth({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="-16 0 352 72"
      className="mx-auto block h-16 w-full max-w-lg"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d="M 28 0 C 28 22, -6 36, 28 50 C 28 60, 28 66, 28 72"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        filter="url(#workflow-glow)"
        className={cn("transition-opacity duration-700", active ? "opacity-100" : "opacity-35")}
      />
      <PathNode cx={28} cy={12} active={active} />
      <PathNode cx={4} cy={36} active={active} />
    </svg>
  );
}

type ConnectorComponent = ComponentType<{ active: boolean }>;

const CONNECTORS: ConnectorComponent[] = [
  ConnectorYouToFirst,
  ConnectorFirstToSecond,
  ConnectorSecondToThird,
  ConnectorThirdToFourth,
];

export function LandingWorkflow() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <LandingSection className="overflow-hidden bg-background">
      <div className="text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          One request. Multiple actions.
        </h2>
      </div>

      <div
        ref={ref}
        className="relative mx-auto mt-14 w-full max-w-lg px-2"
      >
        {/* Central ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-8 left-1/2 h-[32rem] w-64 -translate-x-1/2 rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse, color-mix(in oklch, var(--primary) 28%, transparent) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10">
          <svg className="absolute h-0 w-0 overflow-hidden" aria-hidden>
            <defs>
              <filter id="workflow-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>

          {/* YOU trigger — label inside box */}
          <div
            className={cn(
              "transition-all duration-700",
              inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
            )}
          >
            <div className={cn(workflowCardClass, "py-5")}>
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                You
              </p>
              <p className="mt-3 text-center text-sm leading-relaxed text-foreground sm:text-[15px]">
                Book a meeting with Sarah tomorrow and send a confirmation
                email.
              </p>
            </div>
          </div>

          {FLOW_STEPS.map((step, index) => {
            const Connector = CONNECTORS[index];
            if (!Connector) return null;
            return (
              <div key={step.label}>
                <Connector active={inView} />

                <div
                  className={cn(
                    "transition-all duration-700",
                    inView
                      ? "translate-y-0 opacity-100"
                      : "translate-y-4 opacity-0",
                  )}
                  style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                >
                  <div
                    className={cn(
                      workflowCardClass,
                      "flex items-center gap-3",
                      step.final && "justify-between",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-[0.5rem] border border-primary/40 bg-primary/10">
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

                    {step.final ? (
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-[0.5rem]",
                          "border border-primary/50 bg-primary/15",
                          "shadow-[0_0_16px_color-mix(in_oklch,var(--primary)_50%,transparent)]",
                        )}
                      >
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          strokeWidth={2}
                          className="size-4 text-primary"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </LandingSection>
  );
}
