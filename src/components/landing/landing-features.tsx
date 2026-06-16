import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  InboxIcon,
  LinkSquare01Icon,
  MailEditIcon,
  RefreshIcon,
  WorkflowSquare01Icon,
} from "@hugeicons/core-free-icons";

import { LandingSection } from "@/components/landing/landing-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  {
    title: "AI Email Drafting",
    description: "Draft replies in your voice with inline compose cards.",
    icon: MailEditIcon,
  },
  {
    title: "Smart Scheduling",
    description: "Conflict-aware booking on your primary calendar.",
    icon: Calendar03Icon,
  },
  {
    title: "Gmail Integration",
    description: "Live inbox, send, draft, trash — via Corsair + Gmail API.",
    icon: InboxIcon,
  },
  {
    title: "Google Calendar Sync",
    description: "Week view, create/edit events, realtime webhook updates.",
    icon: LinkSquare01Icon,
  },
  {
    title: "Real-time Updates",
    description: "Pub/Sub push keeps your inbox fresh without refresh.",
    icon: RefreshIcon,
  },
  {
    title: "Multi-step Agent Actions",
    description: "Book a meeting and draft confirmation in one flow.",
    icon: WorkflowSquare01Icon,
  },
] as const;

export function LandingFeatures() {
  return (
    <LandingSection className="bg-muted/20">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Features
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Built for speed, not clutter
        </h2>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card
            key={feature.title}
            size="sm"
            className="rounded-[0.75rem] border-border bg-card"
          >
            <CardHeader className="pb-2">
              <div className="flex size-9 items-center justify-center rounded-[0.5rem] border border-border bg-muted/30">
                <HugeiconsIcon
                  icon={feature.icon}
                  strokeWidth={2}
                  className="size-4 text-primary"
                />
              </div>
              <CardTitle className="mt-3 text-base">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </LandingSection>
  );
}
