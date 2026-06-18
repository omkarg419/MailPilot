import { LandingAgentShowcase } from "@/components/landing/landing-agent-showcase";

import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingPageShell } from "@/components/landing/landing-page-shell";
import { LandingProblem } from "@/components/landing/landing-problem";
import { LandingWorkflow } from "@/components/landing/landing-workflow";
import { LandingWorkspace } from "@/components/landing/landing-workspace";

export function LandingPage() {
  return (
    <LandingPageShell>
      <LandingNavbar />
      <LandingHero />
      <LandingProblem />
      <LandingAgentShowcase />
      <LandingWorkspace />
      <LandingWorkflow />
      <LandingFeatures />
      <LandingCta />
      <LandingFooter />
    </LandingPageShell>
  );
}
