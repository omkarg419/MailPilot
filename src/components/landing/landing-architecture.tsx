import { LandingSection } from "@/components/landing/landing-section";

const STACK = [
  { name: "Next.js", detail: "App Router · tRPC · React 19" },
  { name: "Anthropic", detail: "Claude agent · streaming SSE" },
  { name: "Corsair", detail: "Gmail + Calendar OAuth" },
  { name: "Google Workspace", detail: "Gmail API · Calendar API" },
  { name: "PostgreSQL", detail: "Drizzle ORM · multi-tenant" },
] as const;

export function LandingArchitecture() {
  return (
    <LandingSection id="architecture">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Architecture
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Powered by
        </h2>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STACK.map((item) => (
          <div
            key={item.name}
            className="flex flex-col items-center justify-center rounded-[0.75rem] border border-border bg-card px-4 py-8 text-center"
          >
            <span className="text-lg font-semibold tracking-tight text-foreground">
              {item.name}
            </span>
            <span className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {item.detail}
            </span>
          </div>
        ))}
      </div>
    </LandingSection>
  );
}
