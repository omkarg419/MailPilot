import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { MessagePart } from "@corsair-dev/gmail";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { corsair, getConnectionFlags } from "@/server/corsair";
import {
  buildRawMessage,
  getHeader,
  normalizeMessage,
  parseAddress,
  type MessageView,
} from "@/server/gmail/utils";

const MAILBOX_LABELS = ["INBOX", "SENT", "DRAFT", "SPAM", "TRASH"] as const;

export type ThreadSummary = {
  threadId: string;
  messageId: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  snippet: string;
  date: string | null;
  unread: boolean;
  messageCount: number;
};

export type ThreadDetail = {
  threadId: string;
  subject: string;
  messages: MessageView[];
};

/** Tenant-scoped Gmail client for the signed-in user. */
function gmailFor(userId: string) {
  return corsair.withTenant(userId).gmail;
}

function wrapError(err: unknown, action: string): never {
  const message = err instanceof Error ? err.message : "Unknown error";
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: `Gmail ${action} failed: ${message}`,
    cause: err,
  });
}

type GmailClient = ReturnType<typeof gmailFor>;
type MailboxLabel = (typeof MAILBOX_LABELS)[number];

function messageMatchesLabel(
  labelIds: string[] | undefined,
  label: MailboxLabel,
): boolean {
  const labels = labelIds ?? [];
  if (label === "INBOX") {
    return labels.includes("INBOX") && !labels.includes("TRASH");
  }
  return labels.includes(label);
}

/** Keep Corsair message cache aligned after label changes (trash, read, etc.). */
async function syncThreadMessagesInCache(
  gmail: GmailClient,
  threadId: string,
): Promise<void> {
  const thread = await gmail.api.threads.get({
    id: threadId,
    format: "full",
  });
  await upsertApiThreadToCache(gmail, thread);
}

type ApiThread = Awaited<ReturnType<GmailClient["api"]["threads"]["get"]>>;

async function upsertApiThreadToCache(
  gmail: GmailClient,
  thread: ApiThread,
): Promise<void> {
  const db = gmail.db?.messages;
  if (!db) return;

  const threadId = thread.id ?? thread.messages?.[0]?.threadId;
  if (!threadId) return;

  for (const message of thread.messages ?? []) {
    if (!message.id) continue;
    const payload = message.payload;
    await db.upsertByEntityId(message.id, {
      ...message,
      id: message.id,
      threadId: message.threadId ?? threadId,
      from: getHeader(payload?.headers, "From") ?? undefined,
      subject: getHeader(payload?.headers, "Subject") ?? undefined,
      createdAt: new Date(),
    });
  }
}

/** Build a thread summary from a fully-fetched API thread (uses its latest message). */
function summarizeApiThread(thread: {
  id?: string;
  snippet?: string;
  messages?: Parameters<typeof normalizeMessage>[0][];
}): ThreadSummary | null {
  const messages = thread.messages ?? [];
  if (messages.length === 0) return null;
  const latest = messages[messages.length - 1]!;
  const view = normalizeMessage(latest);
  const unread = messages.some(
    (m) => m.labelIds?.includes("UNREAD") ?? false,
  );
  return {
    threadId: thread.id ?? view.threadId,
    messageId: view.id,
    subject: view.subject,
    fromName: view.fromName,
    fromEmail: view.fromEmail,
    snippet: thread.snippet ?? view.snippet,
    date: view.date,
    unread,
    messageCount: messages.length,
  };
}

export const gmailRouter = createTRPCRouter({
  listThreads: protectedProcedure
    .input(
      z.object({
        label: z.enum(MAILBOX_LABELS).default("INBOX"),
        q: z.string().trim().optional(),
        maxResults: z.number().int().min(1).max(50).default(25),
        pageToken: z.string().optional(),
        /** When true, always pull fresh from the Gmail API (and refresh the cache). */
        refresh: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const connections = await getConnectionFlags(ctx.session.user.id);
      if (!connections.gmail) {
        return { threads: [], nextPageToken: undefined, cached: false };
      }

      const gmail = gmailFor(ctx.session.user.id);

      // Fast path: serve from the Corsair entity cache when we aren't searching
      // and a fresh pull wasn't explicitly requested.
      if (!input.refresh && !input.q) {
        try {
          const cached = await gmail.db.messages.list({ limit: 300 });
          const inLabel = cached.filter((entity) =>
            messageMatchesLabel(entity.data.labelIds, input.label),
          );

          if (inLabel.length > 0) {
            const byThread = new Map<string, (typeof inLabel)[number]>();
            for (const entity of inLabel) {
              const threadId = entity.data.threadId ?? entity.data.id;
              const existing = byThread.get(threadId);
              const ts = entity.data.internalDate
                ? Number(entity.data.internalDate)
                : 0;
              const existingTs = existing?.data.internalDate
                ? Number(existing.data.internalDate)
                : 0;
              if (!existing || ts >= existingTs) byThread.set(threadId, entity);
            }

            const summaries: ThreadSummary[] = [...byThread.values()]
              .map((entity) => {
                const d = entity.data;
                // Prefer the flattened convenience fields; fall back to parsing
                // the cached MIME payload headers when they're absent.
                const payload = d.payload as MessagePart | undefined;
                const fromRaw = d.from ?? getHeader(payload?.headers, "From");
                const subject =
                  d.subject ??
                  getHeader(payload?.headers, "Subject") ??
                  "(no subject)";
                const from = parseAddress(fromRaw);
                const ms = d.internalDate ? Number(d.internalDate) : NaN;
                return {
                  threadId: d.threadId ?? d.id,
                  messageId: d.id,
                  subject,
                  fromName: from.name,
                  fromEmail: from.email,
                  snippet: d.snippet ?? "",
                  date: Number.isFinite(ms)
                    ? new Date(ms).toISOString()
                    : null,
                  unread: d.labelIds?.includes("UNREAD") ?? false,
                  messageCount: 1,
                } satisfies ThreadSummary;
              })
              .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
              .slice(0, input.maxResults);

            return { threads: summaries, nextPageToken: undefined, cached: true };
          }
        } catch {
          // Cache miss / not populated yet — fall through to the live API.
        }
      }

      // Fresh path: query the Gmail API, then hydrate per-thread metadata.
      try {
        // Gmail's threads.list hides SPAM/TRASH unless includeSpamTrash is set.
        const needsSpamTrash =
          input.label === "SPAM" || input.label === "TRASH";
        const list = await gmail.api.threads.list({
          labelIds: [input.label],
          q: input.q,
          maxResults: input.maxResults,
          pageToken: input.pageToken,
          includeSpamTrash: needsSpamTrash || undefined,
        });

        const threads = list.threads ?? [];
        // NOTE: Corsair's `format: "metadata"` returns an empty headers array,
        // so we must request "full" to get From/Subject/Date headers.
        const detailed = await Promise.allSettled(
          threads.map((t) =>
            t.id
              ? gmail.api.threads.get({ id: t.id, format: "full" })
              : Promise.resolve(null),
          ),
        );

        const summaries = detailed
          .map((result) => {
            if (result.status !== "fulfilled" || !result.value) return null;
            return summarizeApiThread(result.value);
          })
          .filter((s): s is ThreadSummary => s !== null);

        // Keep Corsair entity cache in sync so `refresh: false` paths stay current.
        await Promise.allSettled(
          detailed.flatMap((result) => {
            if (result.status !== "fulfilled" || !result.value) return [];
            return [upsertApiThreadToCache(gmail, result.value)];
          }),
        );

        return {
          threads: summaries,
          nextPageToken: list.nextPageToken,
          cached: false,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (
          /401|403|404|invalid_grant|AuthMissing|not connected|Not Found/i.test(
            message,
          )
        ) {
          return { threads: [], nextPageToken: undefined, cached: false };
        }
        wrapError(err, "listThreads");
      }
    }),

  getThread: protectedProcedure
    .input(z.object({ threadId: z.string().min(1) }))
    .query(async ({ ctx, input }): Promise<ThreadDetail> => {
      const gmail = gmailFor(ctx.session.user.id);
      try {
        const thread = await gmail.api.threads.get({
          id: input.threadId,
          format: "full",
        });
        const messages = (thread.messages ?? []).map(normalizeMessage);
        const subject =
          messages.find((m) => m.subject && m.subject !== "(no subject)")
            ?.subject ??
          getHeader(thread.messages?.[0]?.payload?.headers, "Subject") ??
          "(no subject)";
        return {
          threadId: thread.id ?? input.threadId,
          subject,
          messages,
        };
      } catch (err) {
        wrapError(err, "getThread");
      }
    }),

  sendEmail: protectedProcedure
    .input(
      z.object({
        to: z.array(z.string().email()).min(1),
        subject: z.string(),
        body: z.string(),
        threadId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const gmail = gmailFor(ctx.session.user.id);
      const raw = buildRawMessage({
        to: input.to,
        subject: input.subject,
        body: input.body,
      });
      try {
        const result = await gmail.api.messages.send({
          raw,
          threadId: input.threadId,
        });
        return { id: result.id, threadId: result.threadId };
      } catch (err) {
        wrapError(err, "sendEmail");
      }
    }),

  createDraft: protectedProcedure
    .input(
      z.object({
        to: z.array(z.string().email()).min(1),
        subject: z.string(),
        body: z.string(),
        threadId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const gmail = gmailFor(ctx.session.user.id);
      const raw = buildRawMessage({
        to: input.to,
        subject: input.subject,
        body: input.body,
      });
      try {
        const result = await gmail.api.drafts.create({
          draft: { message: { raw, threadId: input.threadId } },
        });
        return { id: result.id };
      } catch (err) {
        wrapError(err, "createDraft");
      }
    }),

  trash: protectedProcedure
    .input(z.object({ threadId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const gmail = gmailFor(ctx.session.user.id);
      try {
        await gmail.api.threads.trash({ id: input.threadId });
        await syncThreadMessagesInCache(gmail, input.threadId);
        return { success: true };
      } catch (err) {
        wrapError(err, "trash");
      }
    }),

  untrash: protectedProcedure
    .input(z.object({ threadId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const gmail = gmailFor(ctx.session.user.id);
      try {
        await gmail.api.threads.untrash({ id: input.threadId });
        try {
          await gmail.api.threads.modify({
            id: input.threadId,
            addLabelIds: ["INBOX"],
            removeLabelIds: ["TRASH"],
          });
        } catch {
          // untrash may have already updated labels
        }
        await syncThreadMessagesInCache(gmail, input.threadId);
        return { success: true };
      } catch (err) {
        wrapError(err, "untrash");
      }
    }),

  markRead: protectedProcedure
    .input(z.object({ threadId: z.string().min(1), read: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const gmail = gmailFor(ctx.session.user.id);
      try {
        await gmail.api.threads.modify({
          id: input.threadId,
          addLabelIds: input.read ? [] : ["UNREAD"],
          removeLabelIds: input.read ? ["UNREAD"] : [],
        });
        await syncThreadMessagesInCache(gmail, input.threadId);
        return { success: true };
      } catch (err) {
        wrapError(err, "markRead");
      }
    }),

  refreshWatch: protectedProcedure.mutation(async ({ ctx }) => {
    const { setupGmailWatch } = await import("@/server/gmail/watch");
    try {
      const result = await setupGmailWatch(ctx.session.user.id);
      if (!result) {
        return {
          success: false as const,
          message: "GMAIL_PUBSUB_TOPIC is not configured.",
        };
      }
      return {
        success: true as const,
        expiration: result.expiration,
        historyId: result.historyId,
      };
    } catch (err) {
      wrapError(err, "refreshWatch");
    }
  }),
});
