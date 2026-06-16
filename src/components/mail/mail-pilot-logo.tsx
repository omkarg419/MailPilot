import { cn } from "@/lib/utils";

import { MailPilotLogoMark } from "./mail-pilot-logo-mark";

/** MailPilot logogram shown beside the wordmark in the sidebar. */
export function MailPilotLogo({ className }: { className?: string }) {
  return <MailPilotLogoMark className={cn("h-7 w-auto", className)} />;
}
