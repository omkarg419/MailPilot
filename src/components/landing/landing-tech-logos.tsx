import { cn } from "@/lib/utils";

function NextJsLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-6", className)}>
      <circle cx="12" cy="12" r="11" fill="currentColor" className="text-foreground" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fill="var(--background)"
        fontSize="11"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        N
      </text>
    </svg>
  );
}

function AnthropicLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-6", className)}>
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        fill="#d4a574"
        className="opacity-90"
      />
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fill="#1a1410"
        fontSize="8"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        AI
      </text>
    </svg>
  );
}

function CorsairLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-6", className)}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
      <path
        fill="currentColor"
        className="text-foreground"
        d="M12 4.5 15.5 9 12 13.5 8.5 9Zm0 6 3.5 4.5L12 19.5 8.5 15Z"
      />
    </svg>
  );
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-6", className)}>
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

function PostgresLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-6", className)}>
      <path
        fill="#8b9aab"
        d="M18.2 10.5c.2-1.8-.3-3.2-1.4-4.2-1.3-1.2-3.4-1.6-5.5-1.3-2 .3-3.7 1.3-4.5 2.7-.5.9-.6 1.9-.4 2.9.3 1.4 1.2 2.5 2.5 3.1.8.4 1.7.6 2.6.6h.3c.2 0 .4.1.5.3.8 1.2 2.2 1.9 3.7 1.9 2.5 0 4.6-2 4.7-4.5.1-.8-.1-1.5-.5-2.1-.2-.3-.1-.7.2-.9.9-.5 1.5-1.5 1.3-2.6z"
      />
      <circle cx="15.5" cy="9" r="0.9" fill="#1a1410" />
      <circle cx="10" cy="11" r="0.7" fill="#1a1410" />
    </svg>
  );
}

function TailwindLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-6", className)}>
      <path
        fill="#38bdf8"
        d="M12 6.5c-2.5 0-4 1.25-4.5 3.75 1-1.25 2.15-1.7 3.45-1.35.75.22 1.28.86 1.87 1.57.96 1.15 2.07 2.48 4.48 2.48 2.5 0 4-1.25 4.5-3.75-1 1.25-2.15 1.7-3.45 1.35-.75-.22-1.28-.86-1.87-1.57C15.52 7.83 14.41 6.5 12 6.5zM6 12.5c-2.5 0-4 1.25-4.5 3.75 1-1.25 2.15-1.7 3.45-1.35.75.22 1.28.86 1.87 1.57.96 1.15 2.07 2.48 4.48 2.48 2.5 0 4-1.25 4.5-3.75-1 1.25-2.15 1.7-3.45 1.35-.75-.22-1.28-.86-1.87-1.57C9.52 13.83 8.41 12.5 6 12.5z"
      />
    </svg>
  );
}

function TrpcLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-6", className)}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-foreground"
        d="M7 8.5a4.5 4.5 0 0 1 7.5 3.2M17 15.5a4.5 4.5 0 0 1-7.5-3.2M12 6v12"
      />
    </svg>
  );
}

export const TECH_STACK = [
  { name: "Next.js", Logo: NextJsLogo },
  { name: "Anthropic", Logo: AnthropicLogo },
  { name: "Corsair", Logo: CorsairLogo },
  { name: "Google Workspace", Logo: GoogleLogo },
  { name: "PostgreSQL", Logo: PostgresLogo },
  { name: "Tailwind CSS", Logo: TailwindLogo },
  { name: "tRPC", Logo: TrpcLogo },
] as const;
