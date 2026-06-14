import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

import { AgentChat } from "@/components/agent/agent-chat";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { auth } from "@/server/auth";

export const metadata: Metadata = {
  title: "Agent — MailPilot",
};

export default async function AgentPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
        <Link
          href="/mail"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-fit text-muted-foreground",
          )}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          Back to mail
        </Link>

        <AgentChat className="flex-1" />
      </div>
    </main>
  );
}
