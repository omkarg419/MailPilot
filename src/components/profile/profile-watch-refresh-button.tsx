"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowReloadHorizontalIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProfileWatchRefreshButtonProps = {
  isPending: boolean;
  onClick: () => void;
  message: string | null;
};

export function ProfileWatchRefreshButton({
  isPending,
  onClick,
  message,
}: ProfileWatchRefreshButtonProps) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={onClick}
        className={cn(
          "h-9 min-w-[8.5rem] gap-2 rounded-[0.75rem] px-2 text-sm font-semibold",
          "shadow-sm transition-all",
          "hover:border-muted-foreground/30 hover:bg-muted/50 hover:shadow",
          "active:scale-[0.98]",
        )}
      >
        <HugeiconsIcon
          icon={ArrowReloadHorizontalIcon}
          strokeWidth={2}
          className={cn("size-3.5", isPending && "animate-spin")}
        />
        {isPending ? "Refreshing…" : "Refresh watch"}
      </Button>
      {message ? (
        <p className="max-w-48 text-right text-[10px] leading-snug text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}
