"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** Staggered refreshes — Gmail indexing can lag several seconds behind push. */
const INBOX_REFRESH_DELAYS_MS = [0, 2_000, 5_000, 10_000] as const;
const INBOX_POLL_INTERVAL_MS = 30_000;
const CALENDAR_REFRESH_DELAYS_MS = [0, 2_000] as const;

const MAIL_INBOX_TOAST_ID = "mail-inbox-sync";

const SHARED_KEY = "__mailPilotMailRealtimeShared__" as const;
const SUPPRESS_UNTIL_KEY = "__mailPilotSuppressInboxNotifyUntil__" as const;
const KNOWN_THREADS_KEY = "__mailPilotKnownInboxThreads__" as const;
const LAST_NOTIFY_AT_KEY = "__mailPilotLastInboxNotifyAt__" as const;
const NOTIFY_COOLDOWN_MS = 8_000;

/** Background inbox refresh (silent — no toast from SSE). */
export const MAIL_INBOX_CHANGED_EVENT = "mailpilot:inbox_changed";
export const CALENDAR_CHANGED_EVENT = "mailpilot:calendar_changed";

type SharedConnection = {
  source: EventSource;
  refCount: number;
  inboxTimers: number[];
  calendarTimers: number[];
};

type GlobalStore = typeof globalThis & {
  [SHARED_KEY]?: SharedConnection;
  [SUPPRESS_UNTIL_KEY]?: number;
  [KNOWN_THREADS_KEY]?: Set<string>;
  [LAST_NOTIFY_AT_KEY]?: number;
};

function getSharedConnection(): SharedConnection | null {
  return (globalThis as GlobalStore)[SHARED_KEY] ?? null;
}

function setSharedConnection(connection: SharedConnection | null): void {
  (globalThis as GlobalStore)[SHARED_KEY] = connection ?? undefined;
}

function getKnownThreadIds(): Set<string> {
  const store = globalThis as GlobalStore;
  store[KNOWN_THREADS_KEY] ??= new Set();
  return store[KNOWN_THREADS_KEY]!;
}

/** Skip notify after the user sends mail (Gmail still pushes webhooks). */
export function suppressInboxNotifyForMs(ms: number): void {
  const store = globalThis as GlobalStore;
  const until = Date.now() + ms;
  store[SUPPRESS_UNTIL_KEY] = Math.max(store[SUPPRESS_UNTIL_KEY] ?? 0, until);
}

function isInboxNotifySuppressed(): boolean {
  return Date.now() < ((globalThis as GlobalStore)[SUPPRESS_UNTIL_KEY] ?? 0);
}

function dispatchRefreshSignals(
  eventName: string,
  delays: readonly number[],
  timers: number[],
) {
  for (const delay of delays) {
    timers.push(
      window.setTimeout(() => {
        window.dispatchEvent(new Event(eventName));
      }, delay),
    );
  }
}

function clearConnectionTimers(connection: SharedConnection) {
  for (const id of connection.inboxTimers) window.clearTimeout(id);
  for (const id of connection.calendarTimers) window.clearTimeout(id);
  connection.inboxTimers.length = 0;
  connection.calendarTimers.length = 0;
}

function attachSharedHandlers(connection: SharedConnection) {
  connection.source.onmessage = (event) => {
    const current = getSharedConnection();
    if (!current) return;

    try {
      const data = JSON.parse(event.data) as { type?: string };
      if (data.type === "inbox_changed") {
        for (const id of current.inboxTimers) window.clearTimeout(id);
        current.inboxTimers.length = 0;
        dispatchRefreshSignals(
          MAIL_INBOX_CHANGED_EVENT,
          INBOX_REFRESH_DELAYS_MS,
          current.inboxTimers,
        );
      } else if (data.type === "calendar_changed") {
        for (const id of current.calendarTimers) window.clearTimeout(id);
        current.calendarTimers.length = 0;
        dispatchRefreshSignals(
          CALENDAR_CHANGED_EVENT,
          CALENDAR_REFRESH_DELAYS_MS,
          current.calendarTimers,
        );
      }
    } catch {
      // ignore malformed SSE payloads
    }
  };

  connection.source.onerror = () => {
    const current = getSharedConnection();
    if (!current) return;
    clearConnectionTimers(current);
  };
}

function acquireSharedConnection(): SharedConnection {
  const existing = getSharedConnection();
  if (existing && existing.source.readyState !== EventSource.CLOSED) {
    existing.refCount += 1;
    return existing;
  }

  if (existing) {
    clearConnectionTimers(existing);
    existing.source.close();
  }

  const source = new EventSource("/api/mail/events");
  const connection: SharedConnection = {
    source,
    refCount: 1,
    inboxTimers: [],
    calendarTimers: [],
  };

  attachSharedHandlers(connection);
  setSharedConnection(connection);
  return connection;
}

function releaseSharedConnection() {
  const connection = getSharedConnection();
  if (!connection) return;

  connection.refCount -= 1;
  if (connection.refCount > 0) return;

  clearConnectionTimers(connection);
  connection.source.close();
  setSharedConnection(null);
}

/** Opens the shared SSE stream (ref-counted across mail / calendar / agent). */
export function useMailRealtimeConnection() {
  useEffect(() => {
    acquireSharedConnection();

    const poll = window.setInterval(() => {
      window.dispatchEvent(new Event(MAIL_INBOX_CHANGED_EVENT));
    }, INBOX_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(poll);
      releaseSharedConnection();
    };
  }, []);
}

export function useMailRealtimeInbox(onInboxChanged: () => void) {
  const handlerRef = useRef(onInboxChanged);
  handlerRef.current = onInboxChanged;

  useEffect(() => {
    const onChanged = () => {
      handlerRef.current();
    };

    window.addEventListener(MAIL_INBOX_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(MAIL_INBOX_CHANGED_EVENT, onChanged);
  }, []);
}

export function useCalendarRealtime(onCalendarChanged: () => void) {
  const handlerRef = useRef(onCalendarChanged);
  handlerRef.current = onCalendarChanged;

  useEffect(() => {
    const onChanged = () => {
      handlerRef.current();
    };

    window.addEventListener(CALENDAR_CHANGED_EVENT, onChanged);
    return () =>
      window.removeEventListener(CALENDAR_CHANGED_EVENT, onChanged);
  }, []);
}

/**
 * Compare inbox thread ids after a silent refresh; toast/badge only when
 * genuinely new threads appear (not on every Gmail webhook).
 */
export function useInboxNewCount(
  isViewingInbox: boolean,
  fetchInboxThreads: () => Promise<{ threadId: string }[]>,
): number {
  const [count, setCount] = useState(0);
  const fetchRef = useRef(fetchInboxThreads);
  fetchRef.current = fetchInboxThreads;
  const isViewingRef = useRef(isViewingInbox);
  isViewingRef.current = isViewingInbox;
  const seededRef = useRef(false);

  const checkForNewMail = useCallback(async () => {
    if (isViewingRef.current) return;

    try {
      const threads = await fetchRef.current();
      const known = getKnownThreadIds();
      const ids = threads.map((t) => t.threadId);

      if (!seededRef.current) {
        for (const id of ids) known.add(id);
        seededRef.current = true;
        return;
      }

      let added = 0;
      for (const id of ids) {
        if (!known.has(id)) added += 1;
      }
      for (const id of ids) known.add(id);

      if (added > 0 && !isInboxNotifySuppressed()) {
        const store = globalThis as GlobalStore;
        const lastAt = store[LAST_NOTIFY_AT_KEY] ?? 0;
        if (Date.now() - lastAt >= NOTIFY_COOLDOWN_MS) {
          store[LAST_NOTIFY_AT_KEY] = Date.now();
          toast.info("New mail received", {
            id: MAIL_INBOX_TOAST_ID,
            description:
              added === 1
                ? "Syncing your inbox…"
                : `${added} new messages — syncing inbox…`,
          });
        }
        setCount((current) => current + added);
      }
    } catch {
      // ignore fetch errors during background sync
    }
  }, []);

  useMailRealtimeInbox(checkForNewMail);

  useEffect(() => {
    if (isViewingInbox) {
      setCount(0);
      seededRef.current = false;
      getKnownThreadIds().clear();
    }
  }, [isViewingInbox]);

  // Seed known threads on mount so the first webhook doesn't false-positive.
  useEffect(() => {
    if (isViewingInbox) return;
    void checkForNewMail();
  }, [checkForNewMail, isViewingInbox]);

  return isViewingInbox ? 0 : count;
}
