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
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-[0.5rem] px-4",
          )}
        >
          Sign In
        </Link>
      </div>
    </header>
  );
}
