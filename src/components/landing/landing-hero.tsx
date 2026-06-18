"use client";

import Link from "next/link";

import { HeroAgentMock } from "@/components/landing/landing-hero-mock";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingHero() {
  return (
    <section className="relative flex min-h-svh flex-col pt-14">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 pb-16 pt-16 sm:pt-20">
        <div className="landing-fade-up flex max-w-3xl flex-col items-center text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            MailPilot
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Triage your inbox, draft replies, and manage your schedule on
            autopilot.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signin"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-10 rounded-[0.75rem] px-6 text-sm",
              )}
            >
              Get Started
            </Link>
            <a
              href="#agent-showcase"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("agent-showcase")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-10 rounded-[0.75rem] px-6 text-sm",
              )}
            >
              Watch Demo
            </a>
          </div>
        </div>

        <div className="landing-fade-up-delay mt-14 w-full sm:mt-16">
          <HeroAgentMock />
        </div>
      </div>
    </section>
  );
}
