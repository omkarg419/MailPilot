import Link from "next/link";

import { MailPilotLogo } from "@/components/mail/mail-pilot-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingNavbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <MailPilotLogo className="h-6" />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            MailPilot
          </span>
        </Link>
        <Link
          href="/signin"
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "h-9 rounded-[0.65rem] border border-primary/35 px-5 text-sm font-medium",
            "bg-primary text-primary-foreground",
            "shadow-[0_0_18px_color-mix(in_oklch,var(--primary)_38%,transparent)]",
            "transition-all duration-200",
            "hover:border-primary/50 hover:brightness-110",
            "hover:shadow-[0_0_26px_color-mix(in_oklch,var(--primary)_52%,transparent)]",
            "active:scale-[0.98]",
          )}
        >
          Sign In
        </Link>
      </div>
    </header>
  );
}
