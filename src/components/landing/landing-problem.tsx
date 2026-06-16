import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

import { LandingSection } from "@/components/landing/landing-section";

const PROBLEMS = [
  "Switch between Gmail and Calendar",
  "Search through endless threads",
  "Write repetitive emails",
  "Manually schedule meetings",
] as const;

export function LandingProblem() {
  return (
    <LandingSection className="bg-muted/20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Your inbox wasn&apos;t designed for AI.
        </h2>
        <ul className="mt-12 space-y-4 text-left sm:mx-auto sm:max-w-md">
          {PROBLEMS.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 text-muted-foreground"
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                strokeWidth={2}
                className="mt-0.5 size-4 shrink-0 text-destructive/80"
              />
              <span className="text-base">{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-12 text-lg font-medium text-foreground">
          MailPilot fixes that.
        </p>
      </div>
    </LandingSection>
  );
}
