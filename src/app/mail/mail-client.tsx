"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";

import { MailSidebar } from "@/components/mail/mail-sidebar";
import { ThreadList } from "@/components/mail/thread-list";
import { ThreadView } from "@/components/mail/thread-view";
import type { MailboxLabel } from "@/components/mail/types";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  forgetKnownInboxThread,
  isInboxRefreshSuppressed,
  markKnownInboxThread,
  seedKnownInboxThreads,
  suppressInboxNotifyForMs,
  suppressInboxRefreshForMs,
  useInboxNewCount,
  useMailRealtimeInbox,
} from "@/hooks/use-mail-realtime";
import {
  fetchAndSyncListThreads,
  getListThreadsQueryInput,
  prependThreadToInboxCache,
  syncListsAfterRestore,
  syncListsAfterSend,
  warmInboxAfterRestore,
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
  const [isListLoading, setIsListLoading] = useState(true);
  const [listTick, setListTick] = useState(0);
  const [hiddenThreadIds, setHiddenThreadIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [excludedFromTrashIds, setExcludedFromTrashIds] = useState<Set<string>>(
    () => new Set(),
  );
  const excludedFromTrashRef = useRef(excludedFromTrashIds);
  excludedFromTrashRef.current = excludedFromTrashIds;

  const utils = api.useUtils();
  const bumpList = useCallback(() => setListTick((t) => t + 1), []);

  const getPreserveInboxIds = useCallback(() => {
    const ids = [...excludedFromTrashRef.current];
    return ids.length > 0 ? { preserveThreadIds: ids } : undefined;
  }, []);

  const listThreadsInput = useMemo(
    () => getListThreadsQueryInput(label, query),
    [label, query],
  );

  const syncCurrentList = useCallback(async () => {
    await fetchAndSyncListThreads(utils.gmail.listThreads, label, query);
    bumpList();
  }, [label, query, utils, bumpList]);

  useEffect(() => {
    let cancelled = false;
    setIsListLoading(true);
    const preserveIds =
      label === "INBOX" ? [...excludedFromTrashIds] : undefined;
    void fetchAndSyncListThreads(
      utils.gmail.listThreads,
      label,
      query,
      preserveIds?.length ? { preserveThreadIds: preserveIds } : undefined,
    )
      .then((data) => {
        if (cancelled) return;
        if (label === "INBOX" && !query) {
          seedKnownInboxThreads(data.threads.map((t) => t.threadId));
        }
        bumpList();
      })
      .finally(() => {
        if (!cancelled) setIsListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [label, query, utils, bumpList, excludedFromTrashIds]);

  const fetchInboxThreads = useCallback(async () => {
    const data = await fetchAndSyncListThreads(
      utils.gmail.listThreads,
      "INBOX",
      undefined,
      getPreserveInboxIds(),
    );
    return data.threads;
  }, [utils, getPreserveInboxIds]);

  const hideThread = useCallback((threadId: string) => {
    setHiddenThreadIds((prev) => {
      if (prev.has(threadId)) return prev;
      const next = new Set(prev);
      next.add(threadId);
      return next;
    });
    bumpList();
  }, [bumpList]);

  const unhideThread = useCallback((threadId: string) => {
    setHiddenThreadIds((prev) => {
      if (!prev.has(threadId)) return prev;
      const next = new Set(prev);
      next.delete(threadId);
      return next;
    });
    bumpList();
  }, [bumpList]);

  const refreshLive = useCallback(() => {
    if (isInboxRefreshSuppressed()) return;
    void syncCurrentList();
    if (label !== "INBOX" || query) {
      void fetchAndSyncListThreads(
        utils.gmail.listThreads,
        "INBOX",
        undefined,
        getPreserveInboxIds(),
      ).then((data) => {
        seedKnownInboxThreads(data.threads.map((t) => t.threadId));
        bumpList();
      });
    }
  }, [syncCurrentList, label, query, utils, bumpList, getPreserveInboxIds]);

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

  // Reads from TanStack cache only — all loads go through `fetchAndSyncListThreads`
  // (`refresh: true`) so stale Corsair entity cache cannot overwrite live Gmail data.
  const threadsQuery = api.gmail.listThreads.useQuery(listThreadsInput, {
    enabled: false,
    staleTime: Infinity,
    structuralSharing: false,
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
      suppressInboxRefreshForMs(10_000);
      suppressInboxNotifyForMs(10_000);
      forgetKnownInboxThread(threadId);
      hideThread(threadId);

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

      return { previous, threadId };
    },
    onError: (_err, { threadId }, context) => {
      if (context?.previous) {
        utils.gmail.listThreads.setData(listThreadsInput, context.previous);
      }
      unhideThread(threadId);
    },
    onSettled: async (_data, error, { threadId }) => {
      if (error) return;
      await syncCurrentList();
      const data = utils.gmail.listThreads.getData(listThreadsInput);
      const stillVisible = data?.threads.some((t) => t.threadId === threadId);
      if (!stillVisible) {
        unhideThread(threadId);
      }
    },
  });
  const untrash = api.gmail.untrash.useMutation({
    onMutate: async ({ threadId }) => {
      suppressInboxRefreshForMs(10_000);
      suppressInboxNotifyForMs(15_000);
      markKnownInboxThread(threadId);
      setExcludedFromTrashIds((prev) => {
        const next = new Set(prev);
        next.add(threadId);
        return next;
      });

      await utils.gmail.listThreads.cancel(listThreadsInput).catch(() => undefined);

      const previous = utils.gmail.listThreads.getData(listThreadsInput);
      const restoredThread = previous?.threads.find(
        (thread) => thread.threadId === threadId,
      );

      utils.gmail.listThreads.setData(listThreadsInput, (old) => {
        if (!old) return old;
        return {
          ...old,
          threads: old.threads.filter((thread) => thread.threadId !== threadId),
        };
      });

      if (restoredThread) {
        prependThreadToInboxCache(utils.gmail.listThreads, restoredThread);
      }

      setSelectedThreadId(null);
      bumpList();

      return { previous, threadId };
    },
    onError: (_err, { threadId }, context) => {
      if (context?.previous) {
        utils.gmail.listThreads.setData(listThreadsInput, context.previous);
      }
      setExcludedFromTrashIds((prev) => {
        const next = new Set(prev);
        next.delete(threadId);
        return next;
      });
      bumpList();
    },
    onSettled: async (_data, error, { threadId }) => {
      if (error) return;
      await syncListsAfterRestore(
        utils.gmail.listThreads,
        label,
        query,
        threadId,
      );
      void warmInboxAfterRestore(utils.gmail.listThreads, threadId).then(() => {
        const inbox = utils.gmail.listThreads.getData(
          getListThreadsQueryInput("INBOX"),
        );
        if (inbox?.threads.some((t) => t.threadId === threadId)) {
          setExcludedFromTrashIds((prev) => {
            if (!prev.has(threadId)) return prev;
            const next = new Set(prev);
            next.delete(threadId);
            return next;
          });
        }
        bumpList();
      });
      bumpList();
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

  const threads = useMemo(() => {
    void listTick;
    let raw =
      utils.gmail.listThreads.getData(listThreadsInput)?.threads ??
      threadsQuery.data?.threads ??
      [];
    if (label === "TRASH" && excludedFromTrashIds.size > 0) {
      raw = raw.filter((thread) => !excludedFromTrashIds.has(thread.threadId));
    }
    if (hiddenThreadIds.size === 0) return raw;
    return raw.filter((thread) => !hiddenThreadIds.has(thread.threadId));
  }, [
    utils,
    listThreadsInput,
    listTick,
    threadsQuery.data,
    hiddenThreadIds,
    excludedFromTrashIds,
    label,
  ]);

  const selectThread = (threadId: string, unread: boolean) => {
    setSelectedThreadId(threadId);
    if (unread) markRead.mutate({ threadId, read: true });
  };

  const onSent = () => {
    setCompose(null);
    void syncListsAfterSend(utils.gmail.listThreads, label, query).then(() => {
      bumpList();
      if (label === "INBOX" && !query) {
        const data = utils.gmail.listThreads.getData(
          getListThreadsQueryInput("INBOX"),
        );
        if (data?.threads) {
          seedKnownInboxThreads(data.threads.map((t) => t.threadId));
        }
      }
    });
    if (selectedThreadId) void utils.gmail.getThread.invalidate();
  };

  const onLabelChange = (nextLabel: MailboxLabel) => {
    if (label === "TRASH" && nextLabel !== "TRASH") {
      setExcludedFromTrashIds(new Set());
    }
    setLabel(nextLabel);
    setSelectedThreadId(null);
    if (nextLabel === "INBOX" && !query) {
      void fetchAndSyncListThreads(
        utils.gmail.listThreads,
        "INBOX",
        undefined,
        excludedFromTrashIds.size > 0
          ? { preserveThreadIds: [...excludedFromTrashIds] }
          : undefined,
      ).then((data) => {
        seedKnownInboxThreads(data.threads.map((t) => t.threadId));
        bumpList();
      });
    }
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
          isLoading={isListLoading && !threadsQuery.data}
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
