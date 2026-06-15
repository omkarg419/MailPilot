import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { auth } from "@/server/auth";
import { getConnectionFlags } from "@/server/corsair";

function GoogleIcon() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    const { gmail, calendar } = await getConnectionFlags(session.user.id);
    redirect(gmail && calendar ? "/agent" : "/connect");
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,color-mix(in_oklch,var(--primary)_25%,transparent),transparent)]"
      />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-8 px-6 py-24 text-center">
        <span className="border border-border bg-muted/60 px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground">
          AI-native email, built for speed
        </span>

        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
          MailPilot
        </h1>

        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          The AI-native Gmail and Calendar platform. Triage your inbox, draft
          replies, and manage your schedule — all on autopilot.
        </p>

        <Link
          href="/signin"
          className={cn(buttonVariants({ variant: "default", size: "lg" }), "mt-2")}
        >
          <GoogleIcon />
          Sign in with Google
        </Link>

        <p className="text-xs text-muted-foreground">
          Connect your Gmail and Google Calendar in under a minute.
        </p>
      </div>
    </main>
  );
}
