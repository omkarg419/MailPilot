import { LandingAgentShowcase } from "@/components/landing/landing-agent-showcase";
import { LandingArchitecture } from "@/components/landing/landing-architecture";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingProblem } from "@/components/landing/landing-problem";
import { LandingWorkflow } from "@/components/landing/landing-workflow";
import { LandingWorkspace } from "@/components/landing/landing-workspace";

export function LandingPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <LandingNavbar />
      <LandingHero />
      <LandingProblem />
      <LandingAgentShowcase />
      <LandingWorkspace />
      <LandingWorkflow />
      <LandingFeatures />
      <LandingArchitecture />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
