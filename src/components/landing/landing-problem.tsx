import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  InboxIcon,
  PencilEdit01Icon,
  SearchIcon,
} from "@hugeicons/core-free-icons";

import { LandingSection } from "@/components/landing/landing-section";
import { cn } from "@/lib/utils";

const PROBLEMS = [
  {
    title: "Switch between apps",
    description:
      "Constantly switching between Gmail, Calendar, and other tools.",
    icon: InboxIcon,
  },
  {
    title: "Search, don't find",
    description: "Important emails and info get buried in the noise.",
    icon: SearchIcon,
  },
  {
    title: "Write the same things",
    description: "Repeating yourself in emails wastes your valuable time.",
    icon: PencilEdit01Icon,
  },
  {
    title: "Manual scheduling",
    description:
      "Finding times, creating events, sending invites—so much work.",
    icon: Calendar03Icon,
  },
] as const;

function ProblemCard({
  title,
  description,
  icon,
}: (typeof PROBLEMS)[number]) {
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-[0.75rem] border border-border bg-card/40 p-5",
        "transition-colors hover:border-border hover:bg-card/60",
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-[0.5rem]",
          "border border-primary/40 bg-primary/10 text-primary",
        )}
      >
        <HugeiconsIcon icon={icon} strokeWidth={2} className="size-[18px]" />
      </div>
      <div className="space-y-2">
        <h3 className="text-base font-semibold leading-snug text-foreground">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </article>
  );
}

export function LandingProblem() {
  return (
    <LandingSection className="bg-background">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          THE PROBLEM
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
          Your inbox wasn&apos;t designed for{" "}
          <span className="text-primary">AI.</span>
        </h2>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PROBLEMS.map((problem) => (
          <ProblemCard key={problem.title} {...problem} />
        ))}
      </div>

      <p className="mt-14 text-center text-lg font-semibold text-primary sm:text-xl">
        MailPilot fixes that.
      </p>
    </LandingSection>
  );
}
