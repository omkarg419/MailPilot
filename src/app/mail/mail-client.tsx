"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";

import { MailSidebar } from "@/components/mail/mail-sidebar";
import { ThreadList } from "@/components/mail/thread-list";
import { ThreadView } from "@/components/mail/thread-view";
import type { MailboxLabel } from "@/components/mail/types";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useMailRealtimeInbox, useInboxNewCount } from "@/hooks/use-mail-realtime";
import {
  fetchAndSyncListThreads,
  getListThreadsQueryInput,
} from "@/lib/mail-list-cache";
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
  const [compose, setCompose] = useState<ComposeInitial | null>(null);
  const [isManualRefresh, setIsManualRefresh] = useState(false);

  const utils = api.useUtils();

  const listThreadsInput = useMemo(
    () => getListThreadsQueryInput(label, query),
    [label, query],
  );

  const syncCurrentList = useCallback(async () => {
    await fetchAndSyncListThreads(utils.gmail.listThreads, label, query);
  }, [label, query, utils]);

  const fetchInboxThreads = useCallback(async () => {
    const data = await fetchAndSyncListThreads(
      utils.gmail.listThreads,
      "INBOX",
    );
    return data.threads;
  }, [utils]);

  const refreshLive = useCallback(() => {
    void syncCurrentList();
    void utils.gmail.listThreads.invalidate(listThreadsInput);
    // Keep INBOX cache warm even when viewing Sent/Draft/Trash.
    if (label !== "INBOX" || query) {
      void fetchAndSyncListThreads(utils.gmail.listThreads, "INBOX");
    }
  }, [syncCurrentList, listThreadsInput, label, query, utils]);

  useMailRealtimeInbox(refreshLive);
  const inboxNewCount = useInboxNewCount(
    label === "INBOX",
    fetchInboxThreads,
  );

  // Debounce the search box → Gmail `q`.
  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const threadsQuery = api.gmail.listThreads.useQuery(listThreadsInput, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    structuralSharing: false,
    retry: 1,
  });

  const threadQuery = api.gmail.getThread.useQuery(
    { threadId: selectedThreadId ?? "" },
    {
      enabled: !!selectedThreadId,
      placeholderData: keepPreviousData,
    },
  );

  const markRead = api.gmail.markRead.useMutation({
    onMutate: async ({ threadId, read }) => {
      const input = listThreadsInput;
      await utils.gmail.listThreads.cancel(input).catch(() => undefined);

      const previous = utils.gmail.listThreads.getData(input);

      utils.gmail.listThreads.setData(input, (old) => {
        if (!old) return old;
        return {
          ...old,
          threads: old.threads.map((thread) =>
            thread.threadId === threadId
              ? { ...thread, unread: !read }
              : thread,
          ),
        };
      });

      return { previous, input };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && context.input) {
        utils.gmail.listThreads.setData(context.input, context.previous);
      }
    },
  });
  const trash = api.gmail.trash.useMutation({
    onMutate: async ({ threadId }) => {
      await utils.gmail.listThreads.cancel(listThreadsInput).catch(() => undefined);

      const previous = utils.gmail.listThreads.getData(listThreadsInput);

      utils.gmail.listThreads.setData(listThreadsInput, (old) => {
        if (!old) return old;
        return {
          ...old,
          threads: old.threads.filter((thread) => thread.threadId !== threadId),
        };
      });

      setSelectedThreadId(null);

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        utils.gmail.listThreads.setData(listThreadsInput, context.previous);
      }
    },
  });
  const untrash = api.gmail.untrash.useMutation({
    onMutate: async ({ threadId }) => {
      await utils.gmail.listThreads.cancel(listThreadsInput).catch(() => undefined);

      const previous = utils.gmail.listThreads.getData(listThreadsInput);

      utils.gmail.listThreads.setData(listThreadsInput, (old) => {
        if (!old) return old;
        return {
          ...old,
          threads: old.threads.filter((thread) => thread.threadId !== threadId),
        };
      });

      setSelectedThreadId(null);

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        utils.gmail.listThreads.setData(listThreadsInput, context.previous);
      }
    },
  });

  const refresh = useCallback(async () => {
    setIsManualRefresh(true);
    try {
      await syncCurrentList();
    } finally {
      setIsManualRefresh(false);
    }
  }, [syncCurrentList]);

  const threads = threadsQuery.data?.threads ?? [];

  const selectThread = (threadId: string, unread: boolean) => {
    setSelectedThreadId(threadId);
    if (unread) markRead.mutate({ threadId, read: true });
  };

  const onSent = () => {
    setCompose(null);
    void syncCurrentList();
    if (selectedThreadId) void utils.gmail.getThread.invalidate();
  };

  const onLabelChange = (nextLabel: MailboxLabel) => {
    setLabel(nextLabel);
    setSelectedThreadId(null);
  };

  return (
    <SidebarProvider className="flex h-svh w-full overflow-hidden bg-background text-foreground">
      <MailSidebar
        activeWorkspace="mail"
        activeLabel={label}
        onLabelChange={onLabelChange}
        onCompose={() => setCompose({})}
        userEmail={userEmail}
        userName={userName}
        userImage={userImage}
        inboxNewCount={inboxNewCount}
      />

      <div className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden">
        <ThreadList
          threads={threads}
          isLoading={threadsQuery.isLoading}
          isRefreshing={isManualRefresh}
          selectedThreadId={selectedThreadId}
          searchInput={searchInput}
          onSearchChange={(value) => {
            setSearchInput(value);
          }}
          onRefresh={refresh}
          onSelectThread={selectThread}
          activeLabel={label}
          isSearchActive={!!query}
        />

        <ThreadView
          thread={threadQuery.data}
          isLoading={threadQuery.isLoading}
          isFetching={threadQuery.isFetching}
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
            const threadId =
              threadQuery.data?.threadId ?? selectedThreadId ?? null;
            if (threadId) trash.mutate({ threadId });
          }}
          onRestore={() => {
            const threadId =
              threadQuery.data?.threadId ?? selectedThreadId ?? null;
            if (threadId) untrash.mutate({ threadId });
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
          isMarkUnreadPending={
            markRead.isPending && markRead.variables?.read === false
          }
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
