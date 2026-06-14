"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  Delete02Icon,
  InboxUnreadIcon,
  Mail01Icon,
  MailReplyIcon,
  RestoreBinIcon,
} from "@hugeicons/core-free-icons";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { EmailBody } from "./email-body";
import { formatDate, initials } from "./mail-utils";
import type { MailboxLabel, ThreadDetail } from "./types";

export type ThreadViewProps = {
  thread: ThreadDetail | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  activeLabel: MailboxLabel;
  onReply: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onMarkUnread: () => void;
  isDeletePending: boolean;
  isRestorePending: boolean;
  selectedThreadId: string | null;
};

function ThreadMessagesSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function ThreadViewHeader({
  subject,
  activeLabel,
  actionsEnabled,
  onReply,
  onDelete,
  onRestore,
  onMarkUnread,
  isDeletePending,
  isRestorePending,
}: {
  subject: string | undefined;
  activeLabel: MailboxLabel;
  actionsEnabled: boolean;
  onReply: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onMarkUnread: () => void;
  isDeletePending: boolean;
  isRestorePending: boolean;
}) {
  return (
    <header className="flex shrink-0 items-center gap-4 border-b border-border px-6 py-4">
      <div className="min-w-0 flex-1">
        {subject ? (
          <h1 className="truncate text-lg font-semibold leading-7 text-foreground">
            {subject}
          </h1>
        ) : (
          <Skeleton className="h-7 w-2/3 max-w-md" />
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReply}
          disabled={!actionsEnabled}
        >
          <HugeiconsIcon icon={MailReplyIcon} strokeWidth={2} />
          Reply
        </Button>
        {activeLabel === "TRASH" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRestore}
            disabled={!actionsEnabled || isRestorePending}
          >
            <HugeiconsIcon icon={RestoreBinIcon} strokeWidth={2} />
            Restore
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={!actionsEnabled || isDeletePending}
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            Delete
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onMarkUnread}
          disabled={!actionsEnabled}
        >
          <HugeiconsIcon icon={InboxUnreadIcon} strokeWidth={2} />
          Mark unread
        </Button>
      </div>
    </header>
  );
}

export function ThreadView({
  thread,
  isLoading,
  isFetching,
  isError,
  activeLabel,
  onReply,
  onDelete,
  onRestore,
  onMarkUnread,
  isDeletePending,
  isRestorePending,
  selectedThreadId,
}: ThreadViewProps) {
  if (!selectedThreadId) {
    return (
      <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <Empty className="h-full border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Select a conversation to read</EmptyTitle>
            <EmptyDescription>
              Choose a thread from the list to view its messages.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    );
  }

  const displayThread =
    thread?.threadId === selectedThreadId ? thread : undefined;
  const showContentLoading =
    !displayThread && (isLoading || isFetching);
  const showError = isError && !displayThread && !isLoading && !isFetching;

  return (
    <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
      <ThreadViewHeader
        subject={displayThread?.subject}
        activeLabel={activeLabel}
        actionsEnabled={!!displayThread}
        onReply={onReply}
        onDelete={onDelete}
        onRestore={onRestore}
        onMarkUnread={onMarkUnread}
        isDeletePending={isDeletePending}
        isRestorePending={isRestorePending}
      />

      <ScrollArea className="min-h-0 flex-1 [scrollbar-gutter:stable]">
        {showError ? (
          <div className="flex items-center justify-center p-6">
            <Alert variant="destructive" className="max-w-md">
              <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
              <AlertTitle>Failed to load conversation</AlertTitle>
              <AlertDescription>
                Something went wrong while fetching this thread. Try selecting
                it again or refresh the list.
              </AlertDescription>
            </Alert>
          </div>
        ) : showContentLoading ? (
          <ThreadMessagesSkeleton />
        ) : displayThread ? (
          <div className="space-y-4 px-6 py-6">
            {displayThread.messages.map((message) => (
              <Card key={message.id} size="sm">
                <CardHeader className="border-b border-border pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar size="sm">
                      <AvatarFallback className="text-xs font-semibold">
                        {initials(message.fromName, message.fromEmail)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {message.fromName || message.fromEmail}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDate(message.date)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        to {message.to || "me"}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 text-sm leading-relaxed text-foreground">
                  {message.bodyHtml ? (
                    <EmailBody html={message.bodyHtml} />
                  ) : (
                    <pre className="whitespace-pre-wrap wrap-break-word font-sans">
                      {message.bodyText || message.snippet}
                    </pre>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </ScrollArea>
    </main>
  );
}
