import type { MailboxLabel } from "@/components/mail/types";
import type { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";

type ListThreadsUtils = ReturnType<typeof api.useUtils>["gmail"]["listThreads"];
type ListThreadsResult = RouterOutputs["gmail"]["listThreads"];

const EMPTY_LIST: ListThreadsResult = {
  threads: [],
  nextPageToken: undefined,
  cached: false,
};

const inflightListThreads = new Map<string, Promise<ListThreadsResult>>();

/** TanStack Query cache key — must match `useQuery` input (omit `refresh`). */
export type ListThreadsQueryInput = {
  label: MailboxLabel;
  q?: string;
};

export function getListThreadsQueryInput(
  label: MailboxLabel,
  q?: string,
): ListThreadsQueryInput {
  return {
    label,
    q: q?.trim() || undefined,
  };
}

/**
 * Pull from Gmail API (`refresh: true`) and write into the visible cache entry.
 * Failures are swallowed so background inbox sync never spams the console.
 */
export async function fetchAndSyncListThreads(
  listThreads: ListThreadsUtils,
  label: MailboxLabel,
  q?: string,
  options?: { preserveThreadIds?: string[] },
): Promise<ListThreadsResult> {
  const cacheInput = getListThreadsQueryInput(label, q);
  const inflightKey = `${cacheInput.label}:${cacheInput.q ?? ""}`;
  const existing = inflightListThreads.get(inflightKey);
  if (existing) return existing;

  const cached = listThreads.getData(cacheInput);

  const request = (async () => {
    try {
      const fresh = await listThreads.fetch({
        ...cacheInput,
        refresh: true,
      });

      const preserveIds = options?.preserveThreadIds ?? [];
      if (preserveIds.length > 0) {
        const prior = cached ?? listThreads.getData(cacheInput);
        const toPreserve =
          prior?.threads.filter(
            (t) =>
              preserveIds.includes(t.threadId) &&
              !fresh.threads.some((f) => f.threadId === t.threadId),
          ) ?? [];
        if (toPreserve.length > 0) {
          const merged = [...toPreserve, ...fresh.threads].sort((a, b) =>
            (b.date ?? "").localeCompare(a.date ?? ""),
          );
          const result = { ...fresh, threads: merged, cached: false };
          listThreads.setData(cacheInput, result);
          return result;
        }
      }

      listThreads.setData(cacheInput, fresh);
      return fresh;
    } catch {
      return cached ?? EMPTY_LIST;
    } finally {
      inflightListThreads.delete(inflightKey);
    }
  })();

  inflightListThreads.set(inflightKey, request);
  return request;
}

type ThreadSummary = ListThreadsResult["threads"][number];

/** Optimistically show a restored thread in Inbox before Gmail indexing catches up. */
export function prependThreadToInboxCache(
  listThreads: ListThreadsUtils,
  thread: ThreadSummary,
) {
  const inboxInput = getListThreadsQueryInput("INBOX");
  listThreads.setData(inboxInput, (old) => {
    const threads = old?.threads ?? [];
    if (threads.some((t) => t.threadId === thread.threadId)) return old;
    return {
      threads: [thread, ...threads],
      nextPageToken: old?.nextPageToken,
      cached: false,
    };
  });
}

/** Optimistically show a trashed thread in Trash before Gmail indexing catches up. */
export function prependThreadToTrashCache(
  listThreads: ListThreadsUtils,
  thread: ThreadSummary,
) {
  const trashInput = getListThreadsQueryInput("TRASH");
  listThreads.setData(trashInput, (old) => {
    const threads = old?.threads ?? [];
    if (threads.some((t) => t.threadId === thread.threadId)) return old;
    return {
      threads: [thread, ...threads],
      nextPageToken: old?.nextPageToken,
      cached: false,
    };
  });
}

/** Staggered Trash pulls — Gmail often lags after trash. */
export function warmTrashAfterDelete(
  listThreads: ListThreadsUtils,
  trashedThreadId: string,
  delaysMs: readonly number[] = [2_000, 5_000, 10_000],
): Promise<void[]> {
  return Promise.all(
    delaysMs.map(
      (delay) =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            void fetchAndSyncListThreads(listThreads, "TRASH", undefined, {
              preserveThreadIds: [trashedThreadId],
            }).finally(() => resolve());
          }, delay);
        }),
    ),
  );
}

/** Staggered Inbox pulls — Gmail often lags after untrash; keep optimistic row until API catches up. */
export function warmInboxAfterRestore(
  listThreads: ListThreadsUtils,
  restoredThreadId: string,
  delaysMs: readonly number[] = [2_000, 5_000, 10_000],
): Promise<void[]> {
  return Promise.all(
    delaysMs.map(
      (delay) =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            void fetchAndSyncListThreads(listThreads, "INBOX", undefined, {
              preserveThreadIds: [restoredThreadId],
            }).finally(() => resolve());
          }, delay);
        }),
    ),
  );
}

/** After trash: strip from Inbox cache; Trash is already optimistic. */
export async function syncListsAfterTrash(
  listThreads: ListThreadsUtils,
  currentLabel: MailboxLabel,
  currentQuery?: string,
  trashedThreadId?: string,
) {
  if (trashedThreadId) {
    const inboxInput = getListThreadsQueryInput("INBOX");
    const inbox = listThreads.getData(inboxInput);
    if (inbox) {
      listThreads.setData(inboxInput, {
        ...inbox,
        threads: inbox.threads.filter((t) => t.threadId !== trashedThreadId),
      });
    }
  }

  if (currentLabel === "TRASH" && trashedThreadId) {
    return;
  }

  if (currentLabel !== "INBOX") {
    await fetchAndSyncListThreads(listThreads, currentLabel, currentQuery);
  }
}

/** After restore from Trash: update Trash cache only — Inbox is already optimistic. */
export async function syncListsAfterRestore(
  listThreads: ListThreadsUtils,
  currentLabel: MailboxLabel,
  currentQuery?: string,
  restoredThreadId?: string,
) {
  if (currentLabel === "TRASH" && restoredThreadId) {
    const trashInput = getListThreadsQueryInput("TRASH", currentQuery);
    const cached = listThreads.getData(trashInput);
    if (cached) {
      listThreads.setData(trashInput, {
        ...cached,
        threads: cached.threads.filter((t) => t.threadId !== restoredThreadId),
      });
    }
    return;
  }

  await fetchAndSyncListThreads(listThreads, "INBOX");

  if (currentLabel !== "INBOX") {
    await fetchAndSyncListThreads(listThreads, currentLabel, currentQuery);
  }
}

/** After send/draft, refresh Sent + Inbox (and the active label) without a full reload. */
export async function syncListsAfterSend(
  listThreads: ListThreadsUtils,
  currentLabel: MailboxLabel,
  currentQuery?: string,
) {
  await fetchAndSyncListThreads(listThreads, currentLabel, currentQuery);

  const extras: MailboxLabel[] = [];
  if (currentLabel !== "SENT") extras.push("SENT");
  if (currentLabel !== "INBOX" || currentQuery) extras.push("INBOX");

  await Promise.all(
    extras.map((l) => fetchAndSyncListThreads(listThreads, l)),
  );
}
