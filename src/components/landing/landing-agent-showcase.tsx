"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  MailSend01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

import { LandingSection } from "@/components/landing/landing-section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

type DemoPhase =
  | "idle"
  | "user"
  | "step1"
  | "step2"
  | "step3"
  | "calendar"
  | "compose";

const STEPS = [
  "Found availability",
  "Created event",
  "Drafted confirmation email",
] as const;

function DemoCalendarCard({ visible }: { visible: boolean }) {
  return (
    <Card
      size="sm"
      className={cn(
        "transition-all duration-500",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0",
      )}
    >
      <CardHeader className="border-b border-border pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">Lunch with Rahul</CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            Proposed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3.5" />
          Tue, Jun 24 · 12:30 – 1:30 PM
        </div>
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-3.5" />
          rahul@example.com
        </div>
        <div className="flex items-center gap-2 text-foreground">
          <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5" />
          Primary calendar
        </div>
      </CardContent>
    </Card>
  );
}

function DemoComposeCard({ visible, body }: { visible: boolean; body: string }) {
  return (
    <Card
      size="sm"
      className={cn(
        "transition-all duration-500 delay-150",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0",
      )}
    >
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <HugeiconsIcon icon={MailSend01Icon} strokeWidth={2} className="size-4" />
          Confirmation email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-3 text-sm">
        <p className="text-muted-foreground">
          <span className="text-foreground">To:</span> rahul@example.com
        </p>
        <p className="text-muted-foreground">
          <span className="text-foreground">Subject:</span> Lunch next week
        </p>
        <p className="min-h-[4rem] whitespace-pre-wrap leading-relaxed text-foreground">
          {body}
          {visible && body.length < 120 ? (
            <span className="landing-cursor ml-px inline-block h-[1em] w-px bg-foreground" />
          ) : null}
        </p>
      </CardContent>
    </Card>
  );
}

const DEMO_COMPOSE_BODY =
  "Hi Rahul,\n\nLooking forward to lunch next Tuesday at 12:30. Let me know if that still works for you.\n\nBest,\nOmkar";

export function LandingAgentShowcase() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.25 });
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [composeBody, setComposeBody] = useState("");
  const [visibleSteps, setVisibleSteps] = useState(0);

  useEffect(() => {
    if (!inView) {
      setPhase("idle");
      setComposeBody("");
      setVisibleSteps(0);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };

    const runCycle = () => {
      setPhase("idle");
      setComposeBody("");
      setVisibleSteps(0);

      schedule(() => setPhase("user"), 400);
      schedule(() => {
        setPhase("step1");
        setVisibleSteps(1);
      }, 1400);
      schedule(() => {
        setPhase("step2");
        setVisibleSteps(2);
      }, 2200);
      schedule(() => {
        setPhase("step3");
        setVisibleSteps(3);
      }, 3000);
      schedule(() => setPhase("calendar"), 3800);
      schedule(() => setPhase("compose"), 4600);

      let i = 0;
      const stream = () => {
        if (i <= DEMO_COMPOSE_BODY.length) {
          setComposeBody(DEMO_COMPOSE_BODY.slice(0, i));
          i += 2;
          timers.push(setTimeout(stream, 28));
        } else {
          timers.push(setTimeout(runCycle, 4000));
        }
      };
      schedule(stream, 4800);
    };

    runCycle();
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <LandingSection id="agent-showcase" className="bg-background">
      <div ref={ref} className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          AI Agent
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          One conversation. Real actions.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Schedule meetings, draft emails, and check your calendar — streamed
          exactly like the live agent.
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-2xl rounded-[1rem] border border-border bg-card p-4 shadow-xl shadow-black/15 sm:p-6">
        <div
          className={cn(
            "flex justify-end transition-all duration-400",
            phase === "idle" ? "opacity-0" : "opacity-100",
          )}
        >
          <div className="max-w-[85%] rounded-[1.2rem] bg-primary px-4 py-2.5 text-[15px] text-primary-foreground">
            Schedule lunch with Rahul next week
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={cn(
                "flex items-center gap-2 text-sm transition-all duration-400",
                visibleSteps > index
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-2 opacity-0",
              )}
            >
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                strokeWidth={2}
                className="size-4 text-primary"
              />
              <span className="text-foreground">{step}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <DemoCalendarCard
            visible={phase === "calendar" || phase === "compose"}
          />
          <DemoComposeCard
            visible={phase === "compose"}
            body={composeBody}
          />
        </div>
      </div>
    </LandingSection>
  );
}
