"use client";

import { useEffect, useState } from "react";

import { MailSidebar } from "@/components/mail/mail-sidebar";
import { ThreadList } from "@/components/mail/thread-list";
import { ThreadView } from "@/components/mail/thread-view";
import type { MailboxLabel } from "@/components/mail/types";
import { SidebarProvider } from "@/components/ui/sidebar";
import { api } from "@/trpc/react";
import { ComposeModal, type ComposeInitial } from "./compose-modal";

export function MailClient({
  userEmail,
  userName,
  userImage,
}: {
  userEmail: string;
  userName: string;
  userImage: string;
}) {
  const [label, setLabel] = useState<MailboxLabel>("INBOX");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [compose, setCompose] = useState<ComposeInitial | null>(null);

  const utils = api.useUtils();

  // Debounce the search box → Gmail `q`.
  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const threadsQuery = api.gmail.listThreads.useQuery({
    label,
    q: query || undefined,
    refresh: refreshing,
  });

  const threadQuery = api.gmail.getThread.useQuery(
    { threadId: selectedThreadId ?? "" },
    { enabled: !!selectedThreadId },
  );

  const markRead = api.gmail.markRead.useMutation({
    onSuccess: () => void utils.gmail.listThreads.invalidate(),
  });
  const trash = api.gmail.trash.useMutation({
    onSuccess: () => {
      setSelectedThreadId(null);
      void utils.gmail.listThreads.invalidate();
    },
  });
  const untrash = api.gmail.untrash.useMutation({
    onSuccess: () => {
      setSelectedThreadId(null);
      void utils.gmail.listThreads.invalidate();
    },
  });

  const refresh = () => {
    setRefreshing(true);
    void utils.gmail.listThreads.invalidate();
  };

  const threads = threadsQuery.data?.threads ?? [];

  const selectThread = (threadId: string, unread: boolean) => {
    setSelectedThreadId(threadId);
    if (unread) markRead.mutate({ threadId, read: true });
  };

  const onSent = () => {
    setCompose(null);
    void utils.gmail.listThreads.invalidate();
    if (selectedThreadId) void utils.gmail.getThread.invalidate();
  };

  const onLabelChange = (nextLabel: MailboxLabel) => {
    setLabel(nextLabel);
    setSelectedThreadId(null);
    setRefreshing(false);
  };

  return (
    <SidebarProvider className="flex h-svh w-full overflow-hidden bg-background text-foreground">
      <MailSidebar
        activeLabel={label}
        onLabelChange={onLabelChange}
        onCompose={() => setCompose({})}
        userEmail={userEmail}
        userName={userName}
        userImage={userImage}
      />

      <div className="flex min-h-0 min-w-0 flex-1">
        <ThreadList
          threads={threads}
          isLoading={threadsQuery.isLoading}
          selectedThreadId={selectedThreadId}
          searchInput={searchInput}
          onSearchChange={(value) => {
            setSearchInput(value);
            setRefreshing(false);
          }}
          onRefresh={refresh}
          onSelectThread={selectThread}
          activeLabel={label}
          isSearchActive={!!query}
        />

        <ThreadView
          thread={threadQuery.data}
          isLoading={threadQuery.isLoading}
          isError={threadQuery.isError}
          activeLabel={label}
          selectedThreadId={selectedThreadId}
          onReply={() =>
            setCompose({
              to: threadQuery.data?.messages[0]?.fromEmail,
              subject: `Re: ${threadQuery.data?.subject ?? ""}`,
              threadId: threadQuery.data?.threadId,
            })
          }
          onDelete={() => {
            if (threadQuery.data) {
              trash.mutate({ threadId: threadQuery.data.threadId });
            }
          }}
          onRestore={() => {
            if (threadQuery.data) {
              untrash.mutate({ threadId: threadQuery.data.threadId });
            }
          }}
          onMarkUnread={() => {
            if (threadQuery.data) {
              markRead.mutate({
                threadId: threadQuery.data.threadId,
                read: false,
              });
            }
          }}
          isDeletePending={trash.isPending}
          isRestorePending={untrash.isPending}
        />
      </div>

      <ComposeModal
        initial={compose}
        onClose={() => setCompose(null)}
        onSent={onSent}
      />
    </SidebarProvider>
  );
}
