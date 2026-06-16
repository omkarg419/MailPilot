"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowReloadHorizontalIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProfileWatchRefreshButtonProps = {
  isPending: boolean;
  onClick: () => void;
  hint: string;
  message: string | null;
};

export function ProfileWatchRefreshButton({
  isPending,
  onClick,
  hint,
  message,
}: ProfileWatchRefreshButtonProps) {
  return (
    <div
      className={cn(
        "flex max-w-[11.5rem] flex-col items-stretch gap-2",
        "rounded-[0.75rem] border border-border/70 bg-muted/25 p-2.5",
        "shadow-sm",
      )}
    >
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={onClick}
        className={cn(
          "h-9 w-full gap-2 rounded-[0.625rem] px-3 text-sm font-semibold",
          "border-border/80 bg-background shadow-sm",
          "transition-all hover:border-muted-foreground/35 hover:bg-muted/40 hover:shadow",
          "active:scale-[0.98]",
        )}
      >
        <HugeiconsIcon
          icon={ArrowReloadHorizontalIcon}
          strokeWidth={2}
          className={cn("size-3.5 shrink-0", isPending && "animate-spin")}
        />
        {isPending ? "Refreshing…" : "Refresh watch"}
      </Button>

      <p className="text-center text-[11px] leading-snug text-muted-foreground">
        {hint}
      </p>

      {message ? (
        <p
          className={cn(
            "border-t border-border/60 pt-2 text-center text-[10px] leading-snug",
            message.toLowerCase().includes("renewed")
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-destructive",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
