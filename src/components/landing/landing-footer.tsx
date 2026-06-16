import Link from "next/link";

import { MailPilotLogo } from "@/components/mail/mail-pilot-logo";

const PRODUCT_LINKS = [
  { label: "GitHub", href: "#" },
  { label: "Demo", href: "#agent-showcase" },
  { label: "Privacy", href: "#" },
] as const;

export function LandingFooter() {
  return (
    <footer className="bg-background py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <MailPilotLogo className="h-6" />
            <span className="text-sm font-semibold text-foreground">
              MailPilot
            </span>
          </Link>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Product
          </p>
          <ul className="mt-3 space-y-2">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-muted-foreground">
          Built by Omkar Gupta
        </p>
      </div>
    </footer>
  );
}
