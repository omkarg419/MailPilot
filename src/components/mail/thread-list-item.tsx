"use client";

import { cn } from "@/lib/utils";

import { formatDate } from "./mail-utils";
import type { ThreadSummary } from "./types";

type ThreadListItemProps = {
  thread: ThreadSummary;
  selected: boolean;
  onSelect: () => void;
};

export function ThreadListItem({
  thread,
  selected,
  onSelect,
}: ThreadListItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left transition-colors",
        selected ? "bg-accent" : "hover:bg-accent/50",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "truncate text-sm",
            thread.unread
              ? "font-semibold text-foreground"
              : "text-muted-foreground",
          )}
        >
          {thread.fromName || thread.fromEmail || "(unknown)"}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatDate(thread.date)}
        </span>
      </div>
      <span
        className={cn(
          "truncate text-sm",
          thread.unread ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {thread.subject}
      </span>
      <span className="truncate text-xs text-muted-foreground">
        {thread.snippet}
      </span>
    </button>
  );
}
