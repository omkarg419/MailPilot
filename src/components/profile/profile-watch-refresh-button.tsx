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
    <div className="flex max-w-[11rem] flex-col items-end gap-1.5">
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={onClick}
        className={cn(
          "h-10 w-full gap-2 rounded-[0.75rem] px-3 text-sm font-medium",
          "border-white/12 bg-white/[0.04] text-foreground shadow-sm",
          "transition-all hover:border-white/20 hover:bg-white/[0.07]",
          "active:scale-[0.98]",
        )}
      >
        <HugeiconsIcon
          icon={ArrowReloadHorizontalIcon}
          strokeWidth={2}
          className={cn("size-4 shrink-0", isPending && "animate-spin")}
        />
        {isPending ? "Refreshing…" : "Refresh watch"}
      </Button>

      <p className="text-right text-[10px] leading-snug text-muted-foreground/80">
        {hint}
      </p>

      {message ? (
        <p
          className={cn(
            "text-right text-[10px] leading-snug",
            message.toLowerCase().includes("renewed")
              ? "text-emerald-500"
              : "text-destructive",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
