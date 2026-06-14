"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowReloadHorizontalIcon,
  InboxIcon,
  SearchIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { ThreadListItem } from "./thread-list-item";
import { LABEL_NAMES, type MailboxLabel, type ThreadSummary } from "./types";

export type ThreadListProps = {
  threads: ThreadSummary[];
  isLoading: boolean;
  selectedThreadId: string | null;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onSelectThread: (threadId: string, unread: boolean) => void;
  activeLabel: MailboxLabel;
  isSearchActive: boolean;
};

function ThreadListSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 border-b border-border px-4 py-3"
        >
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function ThreadList({
  threads,
  isLoading,
  selectedThreadId,
  searchInput,
  onSearchChange,
  onRefresh,
  onSelectThread,
  activeLabel,
  isSearchActive,
}: ThreadListProps) {
  return (
    <section className="flex h-full w-96 shrink-0 flex-col border-r border-border bg-background">
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-foreground">
          {LABEL_NAMES[activeLabel]}
        </h2>
        <div className="flex items-center gap-2">
          <InputGroup className="flex-1">
            <InputGroupAddon align="inline-start">
              <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search mail"
            />
          </InputGroup>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onRefresh}
            title="Refresh from Gmail"
          >
            <HugeiconsIcon icon={ArrowReloadHorizontalIcon} strokeWidth={2} />
          </Button>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {isLoading ? (
          <ThreadListSkeleton />
        ) : threads.length === 0 ? (
          <Empty className="h-full min-h-48 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={InboxIcon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>
                {isSearchActive ? "No matching messages" : "Nothing here yet"}
              </EmptyTitle>
              <EmptyDescription>
                {isSearchActive
                  ? "Try a different search term."
                  : `Your ${LABEL_NAMES[activeLabel].toLowerCase()} is empty.`}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div>
            {threads.map((thread) => (
              <ThreadListItem
                key={thread.threadId}
                thread={thread}
                selected={selectedThreadId === thread.threadId}
                onSelect={() => onSelectThread(thread.threadId, thread.unread)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </section>
  );
}
