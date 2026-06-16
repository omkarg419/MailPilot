import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function GoogleIcon() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        className="opacity-80"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="currentColor"
        className="opacity-70"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="currentColor"
        className="opacity-60"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="currentColor"
        className="opacity-75"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export function LandingCta() {
  return (
    <section className="border-b border-border py-28">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Ready to take control of your inbox?
        </h2>
        <Link
          href="/signin"
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-10 inline-flex h-11 rounded-[0.75rem] px-8 text-sm",
          )}
        >
          <GoogleIcon />
          Connect Google Account
        </Link>
      </div>
    </section>
  );
}
