import type { MailboxLabel } from "@/components/mail/types";
import type { api } from "@/trpc/react";

type ListThreadsUtils = ReturnType<typeof api.useUtils>["gmail"]["listThreads"];

/** TanStack Query cache key — `refresh` is intentionally omitted (see fetchAndSyncListThreads). */
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
    q: q || undefined,
  };
}

/**
 * Pull from Gmail API (`refresh: true`) and write into the single visible cache entry
 * so background sync never races a separate `refresh: false` query.
 */
export async function fetchAndSyncListThreads(
  listThreads: ListThreadsUtils,
  label: MailboxLabel,
  q?: string,
) {
  const cacheInput = getListThreadsQueryInput(label, q);
  const fresh = await listThreads.fetch({
    ...cacheInput,
    refresh: true,
  });
  listThreads.setData(cacheInput, (old) => {
    if (!old?.threads.length) return fresh;

    const prevIds = new Set(old.threads.map((t) => t.threadId));
    const newThreads = fresh.threads.filter((t) => !prevIds.has(t.threadId));

    // Nothing new — keep stable row references when order is unchanged.
    if (newThreads.length === 0) {
      const sameOrder =
        old.threads.length === fresh.threads.length &&
        old.threads.every(
          (t, i) => t.threadId === fresh.threads[i]?.threadId,
        );
      if (sameOrder) {
        return {
          ...old,
          threads: old.threads.map((t, i) => {
            const next = fresh.threads[i]!;
            if (
              t.unread === next.unread &&
              t.snippet === next.snippet &&
              t.subject === next.subject
            ) {
              return t;
            }
            return next;
          }),
        };
      }
    }

    return fresh;
  });
  return listThreads.getData(cacheInput) ?? fresh;
}
