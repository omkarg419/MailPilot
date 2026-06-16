import Link from "next/link";

import { MailPilotLogo } from "@/components/mail/mail-pilot-logo";
import { cn } from "@/lib/utils";

function FooterAutomationLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex w-[min(100vw-12rem,28rem)] flex-col items-center justify-center",
        className,
      )}
    >
      <svg
        viewBox="0 0 520 52"
        className="h-12 w-full"
        aria-hidden
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Main circuit path */}
        <path
          d="M 0 18 H 72 L 88 18 L 96 26 L 104 18 H 168
             L 176 26 L 184 34 H 336
             L 344 26 L 352 18 H 416
             L 424 26 L 432 18 H 520"
          fill="none"
          stroke="oklch(1 0 0 / 12%)"
          strokeWidth="1"
        />

        {/* Orange nodes */}
        {[
          [0, 18],
          [88, 18],
          [96, 26],
          [176, 26],
          [184, 34],
          [336, 34],
          [344, 26],
          [424, 26],
          [432, 18],
          [520, 18],
        ].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={2.5}
            fill="var(--primary)"
            opacity={i === 0 || i === 9 ? 1 : 0.75}
          />
        ))}

        {/* Left plug connector */}
        <g transform="translate(148, 12)">
          <rect
            x="0"
            y="4"
            width="14"
            height="10"
            rx="2"
            fill="none"
            stroke="oklch(1 0 0 / 20%)"
            strokeWidth="1"
          />
          <path
            d="M 14 7 H 20 M 14 11 H 20"
            stroke="oklch(1 0 0 / 25%)"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </g>

        {/* Right plug connector */}
        <g transform="translate(358, 12)">
          <path
            d="M 0 7 H 6 M 0 11 H 6"
            stroke="oklch(1 0 0 / 25%)"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <rect
            x="6"
            y="4"
            width="14"
            height="10"
            rx="2"
            fill="none"
            stroke="oklch(1 0 0 / 20%)"
            strokeWidth="1"
          />
        </g>

        {/* Envelope + rocket (center) */}
        <g transform="translate(248, 20)">
          {/* Envelope */}
          <rect
            x="4"
            y="8"
            width="28"
            height="18"
            rx="2"
            fill="none"
            stroke="oklch(0.98 0.01 95 / 85%)"
            strokeWidth="1.25"
          />
          <path
            d="M 4 10 L 18 20 L 32 10"
            fill="none"
            stroke="oklch(0.98 0.01 95 / 85%)"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          {/* Rocket */}
          <path
            d="M 30 4 L 36 10 L 33 11 L 35 16 L 30 13 L 25 16 L 27 11 L 24 10 Z"
            fill="var(--primary)"
          />
          <path
            d="M 27 16 L 25 20 M 33 16 L 35 20"
            stroke="var(--primary)"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.8"
          />
        </g>
      </svg>
      <p className="-mt-1 text-[10px] tracking-wide text-muted-foreground/80">
        Automation engine
      </p>
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-background py-5">
      {/* Subtle top-center glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 h-20 w-56 -translate-x-1/2 opacity-50 blur-2xl"
        style={{
          background:
            "radial-gradient(ellipse at top, color-mix(in oklch, var(--primary) 35%, transparent), transparent 70%)",
        }}
      />

      <div className="relative mx-auto min-h-14 max-w-6xl px-6">
        <div className="flex items-center justify-between gap-4">
          {/* Left — branding */}
          <Link href="/" className="relative z-10 flex shrink-0 items-center gap-2.5">
            <MailPilotLogo className="h-7 w-auto" />
            <span className="text-base font-bold tracking-tight text-foreground">
              MailPilot
            </span>
          </Link>

          {/* Right — copyright */}
          <p className="relative z-10 shrink-0 whitespace-nowrap text-right font-mono text-[10px] text-muted-foreground sm:text-[11px]">
            © 2026 MailPilot. Smart inbox automation.
          </p>
        </div>

        {/* Center — dead center of footer (viewport-independent) */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:block">
          <FooterAutomationLine />
        </div>
      </div>
    </footer>
  );
}
