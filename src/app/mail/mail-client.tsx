"use client";

import { useEffect, useState } from "react";

import { api } from "@/trpc/react";
import { ComposeModal, type ComposeInitial } from "./compose-modal";

type MailboxLabel = "INBOX" | "SENT" | "DRAFT" | "SPAM" | "TRASH";

const LABELS: { id: MailboxLabel; name: string; icon: string }[] = [
  { id: "INBOX", name: "Inbox", icon: "📥" },
  { id: "SENT", name: "Sent", icon: "📤" },
  { id: "DRAFT", name: "Drafts", icon: "📝" },
  { id: "SPAM", name: "Spam", icon: "⚠️" },
  { id: "TRASH", name: "Trash", icon: "🗑" },
];

function initials(name: string, email: string): string {
  const source = name || email;
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0]! + parts[1][0]!).toUpperCase();
  }
  return (source[0] ?? "?").toUpperCase();
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
}

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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Left sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950 px-3 py-5">
        <div className="flex items-center gap-2 px-2 pb-6">
          <span className="text-xl font-extrabold tracking-tight">
            Mail
            <span className="bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Pilot
            </span>
          </span>
        </div>

        <button
          onClick={() => setCompose({})}
          className="mb-6 flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-400"
        >
          ✏️ Compose
        </button>

        <nav className="flex flex-col gap-1">
          {LABELS.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                setLabel(l.id);
                setSelectedThreadId(null);
                setRefreshing(false);
              }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                label === l.id
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              <span>{l.icon}</span>
              {l.name}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-3 rounded-lg px-2 py-2">
          {userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userImage}
              alt={userName}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-300">
              {initials(userName, userEmail)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-zinc-300">
              {userName || "Signed in"}
            </p>
            <p className="truncate text-xs text-zinc-600">{userEmail}</p>
          </div>
        </div>
      </aside>

      {/* Middle: thread list */}
      <section className="flex w-96 shrink-0 flex-col border-r border-zinc-800/80">
        <div className="flex items-center gap-2 border-b border-zinc-800/80 px-4 py-3">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
              🔍
            </span>
            <input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setRefreshing(false);
              }}
              placeholder="Search mail"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-700"
            />
          </div>
          <button
            onClick={() => void refresh()}
            title="Refresh from Gmail"
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition hover:text-zinc-100"
          >
            ↻
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {threadsQuery.isLoading ? (
            <ThreadListSkeleton />
          ) : threads.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <span className="text-3xl">📭</span>
              <p className="text-sm text-zinc-500">
                {query ? "No matching messages" : "Nothing here yet"}
              </p>
            </div>
          ) : (
            threads.map((t) => (
              <button
                key={t.threadId}
                onClick={() => selectThread(t.threadId, t.unread)}
                className={`flex w-full flex-col gap-1 border-b border-zinc-900 px-4 py-3 text-left transition ${
                  selectedThreadId === t.threadId
                    ? "bg-zinc-900"
                    : "hover:bg-zinc-900/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`truncate text-sm ${
                      t.unread
                        ? "font-semibold text-zinc-100"
                        : "text-zinc-300"
                    }`}
                  >
                    {t.fromName || t.fromEmail || "(unknown)"}
                  </span>
                  <span className="shrink-0 text-xs text-zinc-600">
                    {formatDate(t.date)}
                  </span>
                </div>
                <span
                  className={`truncate text-sm ${
                    t.unread ? "text-zinc-200" : "text-zinc-400"
                  }`}
                >
                  {t.subject}
                </span>
                <span className="truncate text-xs text-zinc-600">
                  {t.snippet}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Right: thread view */}
      <main className="flex min-w-0 flex-1 flex-col">
        {!selectedThreadId ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <span className="text-4xl">✉️</span>
            <p className="text-sm text-zinc-500">
              Select a conversation to read
            </p>
          </div>
        ) : threadQuery.isLoading ? (
          <ThreadViewSkeleton />
        ) : threadQuery.data ? (
          <>
            <header className="flex items-center justify-between gap-4 border-b border-zinc-800/80 px-6 py-4">
              <h1 className="truncate text-lg font-semibold text-zinc-100">
                {threadQuery.data.subject}
              </h1>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() =>
                    setCompose({
                      to: threadQuery.data?.messages[0]?.fromEmail,
                      subject: `Re: ${threadQuery.data?.subject ?? ""}`,
                      threadId: threadQuery.data?.threadId,
                    })
                  }
                  className="rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800"
                >
                  ↩ Reply
                </button>
                {label === "TRASH" ? (
                  <button
                    onClick={() =>
                      untrash.mutate({ threadId: threadQuery.data.threadId })
                    }
                    disabled={untrash.isPending}
                    className="rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    ♻ Restore
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      trash.mutate({ threadId: threadQuery.data.threadId })
                    }
                    disabled={trash.isPending}
                    className="rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    🗑 Delete
                  </button>
                )}
                <button
                  onClick={() =>
                    markRead.mutate({
                      threadId: threadQuery.data.threadId,
                      read: false,
                    })
                  }
                  className="rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800"
                >
                  Mark unread
                </button>
              </div>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              {threadQuery.data.messages.map((m) => (
                <article
                  key={m.id}
                  className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40"
                >
                  <div className="flex items-start gap-3 border-b border-zinc-800/60 px-5 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-300">
                      {initials(m.fromName, m.fromEmail)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-zinc-200">
                          {m.fromName || m.fromEmail}
                        </span>
                        <span className="shrink-0 text-xs text-zinc-600">
                          {formatDate(m.date)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-zinc-500">
                        to {m.to || "me"}
                      </p>
                    </div>
                  </div>
                  <div className="px-5 py-4 text-sm leading-relaxed text-zinc-300">
                    {m.bodyHtml ? (
                      <div
                        className="prose-email max-w-none wrap-break-word"
                        // Rendering the signed-in user's own mailbox content.
                        dangerouslySetInnerHTML={{ __html: m.bodyHtml }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap wrap-break-word font-sans">
                        {m.bodyText || m.snippet}
                      </pre>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-red-400">Failed to load conversation.</p>
          </div>
        )}
      </main>

      <ComposeModal
        initial={compose}
        onClose={() => setCompose(null)}
        onSent={onSent}
      />
    </div>
  );
}

function ThreadListSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 border-b border-zinc-900 px-4 py-3">
          <div className="flex justify-between">
            <div className="h-3 w-24 rounded bg-zinc-800" />
            <div className="h-3 w-10 rounded bg-zinc-800" />
          </div>
          <div className="h-3 w-3/4 rounded bg-zinc-800" />
          <div className="h-3 w-1/2 rounded bg-zinc-900" />
        </div>
      ))}
    </div>
  );
}

function ThreadViewSkeleton() {
  return (
    <div className="animate-pulse space-y-4 px-6 py-6">
      <div className="h-5 w-1/2 rounded bg-zinc-800" />
      <div className="h-32 w-full rounded-xl bg-zinc-900" />
      <div className="h-32 w-full rounded-xl bg-zinc-900" />
    </div>
  );
}
