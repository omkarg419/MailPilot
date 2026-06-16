import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Link01Icon,
  LockIcon,
} from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("size-4 shrink-0", className)} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#fff"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#fff"
        fillOpacity="0.95"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#fff"
        fillOpacity="0.9"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#fff"
        fillOpacity="0.92"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

const glassCardClass = cn(
  "relative overflow-hidden rounded-[1.25rem] border border-white/10",
  "bg-white/[0.04] backdrop-blur-xl",
  "shadow-[0_0_40px_color-mix(in_oklch,var(--primary)_12%,transparent)]",
);

function GlassCardStack({
  children,
  label,
  linkCorner = "right",
  className,
}: {
  children: React.ReactNode;
  label: string;
  linkCorner?: "left" | "right";
  className?: string;
}) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[17rem]", className)}>
      {/* Back stack layer */}
      <div
        aria-hidden
        className={cn(
          glassCardClass,
          "absolute inset-0 translate-x-2 translate-y-2 opacity-35",
        )}
      />
      <div className={cn(glassCardClass, "relative flex min-h-[15rem] flex-col px-5 pb-4 pt-5")}>
        <div
          className={cn(
            "absolute top-4 text-primary/80",
            linkCorner === "right" ? "right-4" : "left-4",
          )}
        >
          <HugeiconsIcon icon={Link01Icon} strokeWidth={2} className="size-4" />
        </div>
        <div className="flex flex-1 items-center justify-center">{children}</div>
        <p className="mt-3 text-center text-sm font-medium text-foreground/90">
          {label}
        </p>
      </div>
    </div>
  );
}

function InboxCardGraphic() {
  return (
    <svg viewBox="0 0 200 120" className="h-auto w-full max-w-[11rem]" aria-hidden>
      {/* Avatars column */}
      {[24, 60, 96].map((y, i) => (
        <g key={y}>
          <circle cx="28" cy={y} r="14" fill="oklch(0.35 0.02 45)" stroke="oklch(1 0 0 / 12%)" />
          <circle cx="28" cy={y} r="6" fill="oklch(0.55 0.03 45)" />
          <path
            d={`M 42 ${y} C 70 ${y - 4}, 100 ${y + (i === 1 ? 0 : 4)}, 128 ${y}`}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.5"
            strokeOpacity="0.7"
          />
          <rect
            x="132"
            y={y - 12}
            width="48"
            height="24"
            rx="6"
            fill={i === 1 ? "var(--primary)" : "oklch(0.92 0.01 45 / 18%)"}
            stroke={i === 1 ? "var(--primary)" : "oklch(1 0 0 / 15%)"}
            strokeWidth="1"
          />
          <path
            d={`M 140 ${y - 2} L 172 ${y - 2} M 140 ${y + 4} L 164 ${y + 4}`}
            stroke={i === 1 ? "oklch(0.98 0.02 95)" : "oklch(1 0 0 / 25%)"}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      ))}
    </svg>
  );
}

function PadlockGraphic() {
  return (
    <div className="relative flex items-center justify-center">
      <div
        aria-hidden
        className="absolute size-24 rounded-full opacity-60 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--primary) 45%, transparent), transparent 70%)",
        }}
      />
      <svg viewBox="0 0 80 96" className="relative h-24 w-20" aria-hidden>
        <defs>
          <linearGradient id="lock-body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.85 0.01 45)" />
            <stop offset="50%" stopColor="oklch(0.72 0.02 45)" />
            <stop offset="100%" stopColor="oklch(0.55 0.04 45)" />
          </linearGradient>
          <linearGradient id="lock-shackle" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.9 0.01 45)" />
            <stop offset="100%" stopColor="oklch(0.65 0.03 45)" />
          </linearGradient>
        </defs>
        <path
          d="M 24 40 V 28 C 24 16 32 8 40 8 C 48 8 56 16 56 28 V 40"
          fill="none"
          stroke="url(#lock-shackle)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <rect x="16" y="40" width="48" height="44" rx="8" fill="url(#lock-body)" />
        <circle cx="40" cy="58" r="5" fill="oklch(0.35 0.02 45)" />
        <rect x="38" y="58" width="4" height="14" rx="2" fill="oklch(0.35 0.02 45)" />
      </svg>
    </div>
  );
}

function SecurityArc() {
  const locks = [-80, -40, 0, 40, 80];
  return (
    <div className="relative mt-2 h-16 w-full max-w-md">
      <svg
        viewBox="0 0 400 64"
        className="absolute inset-0 h-full w-full"
        aria-hidden
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d="M 20 8 C 80 48, 120 56, 200 52 C 280 48, 320 40, 380 8"
          fill="none"
          stroke="oklch(1 0 0 / 18%)"
          strokeWidth="1"
        />
        <path
          d="M 60 20 C 120 44, 160 50, 200 48 C 240 46, 280 38, 340 20"
          fill="none"
          stroke="oklch(1 0 0 / 10%)"
          strokeWidth="1"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-center">
        {locks.map((x) => (
          <div
            key={x}
            className="absolute flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md"
            style={{
              left: `calc(50% + ${x}px)`,
              transform: "translateX(-50%)",
              bottom: x === 0 ? "4px" : "8px",
            }}
          >
            <HugeiconsIcon
              icon={LockIcon}
              strokeWidth={2}
              className="size-3.5 text-foreground/70"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CircuitLines() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
      viewBox="0 0 1200 400"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <path
        d="M 180 200 C 280 220, 340 260, 420 280"
        fill="none"
        stroke="oklch(1 0 0 / 12%)"
        strokeWidth="1"
      />
      <path
        d="M 1020 200 C 920 220, 860 260, 780 280"
        fill="none"
        stroke="oklch(1 0 0 / 12%)"
        strokeWidth="1"
      />
    </svg>
  );
}

function CtaPedestal({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex w-full flex-col items-center">
      <div className="relative z-10 mb-1">{children}</div>
      {/* Tiered platform */}
      <div
        aria-hidden
        className="relative h-5 w-56 rounded-[0.65rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.08] to-white/[0.02] shadow-[0_0_30px_color-mix(in_oklch,var(--primary)_25%,transparent)]"
      />
      <div
        aria-hidden
        className="-mt-1 h-3 w-64 rounded-b-[0.85rem] border border-t-0 border-white/[0.06] bg-gradient-to-b from-white/[0.05] to-transparent"
        style={{
          boxShadow:
            "0 8px 32px color-mix(in oklch, var(--primary) 20%, transparent)",
        }}
      />
      <SecurityArc />
      <p className="mt-5 text-xs text-muted-foreground">
        Secured by Google Authentication.
      </p>
    </div>
  );
}

export function LandingCta() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background py-24 lg:py-32">
      {/* Side glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-[8%] h-64 w-64 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--primary) 30%, transparent), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-[8%] h-64 w-64 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--primary) 30%, transparent), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-16 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--primary) 25%, transparent), transparent 70%)",
        }}
      />

      <CircuitLines />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
          {/* Left — In-Control Inbox */}
          <GlassCardStack label="In-Control Inbox" linkCorner="right" className="lg:justify-self-end">
            <InboxCardGraphic />
          </GlassCardStack>

          {/* Center CTA */}
          <div className="relative z-10 flex flex-col items-center text-center lg:min-w-[22rem] lg:max-w-md">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.35rem] lg:leading-tight">
              Ready to take control
              <br />
              of your inbox?
            </h2>

            <div className="mt-10 w-full">
              <CtaPedestal>
                <Link
                  href="/signin"
                  className={cn(
                    "inline-flex h-11 items-center justify-center gap-2.5 rounded-[0.75rem] px-7 text-sm font-medium",
                    "bg-primary text-primary-foreground",
                    "shadow-[0_0_28px_color-mix(in_oklch,var(--primary)_45%,transparent)]",
                    "transition-all hover:brightness-110 active:scale-[0.98]",
                  )}
                >
                  <GoogleIcon />
                  Connect Google Account
                </Link>
              </CtaPedestal>
            </div>
          </div>

          {/* Right — Verified Account */}
          <GlassCardStack label="Verified Account" linkCorner="left" className="lg:justify-self-start">
            <PadlockGraphic />
          </GlassCardStack>
        </div>
      </div>
    </section>
  );
}
