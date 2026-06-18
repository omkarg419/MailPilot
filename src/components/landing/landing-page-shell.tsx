"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

type LandingPageShellProps = {
  children: React.ReactNode;
};

export function LandingPageShell({ children }: LandingPageShellProps) {
  return (
    <div className="h-svh overflow-hidden bg-background text-foreground">
      <ScrollArea className="h-full">{children}</ScrollArea>
    </div>
  );
}
