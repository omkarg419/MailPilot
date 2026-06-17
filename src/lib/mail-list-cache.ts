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
