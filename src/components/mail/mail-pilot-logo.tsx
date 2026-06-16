import { cn } from "@/lib/utils";

/** Orange folded-mail mark shown beside the MailPilot wordmark in the sidebar. */
export function MailPilotLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("size-6 shrink-0 text-sidebar-primary", className)}
    >
      <path
        d="M4 6.5 12 3l8 3.5v11L12 21 4 17.5V6.5Z"
        fill="currentColor"
        fillOpacity={0.22}
      />
      <path
        d="m4 6.5 8 10.25 4-3.75 4 3.75 4-3.75v11L12 21 4 17.5V6.5Z"
        fill="currentColor"
      />
      <path
        d="M4 6.5 12 11.5 20 6.5"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinejoin="round"
      />
    </svg>
  );
}
