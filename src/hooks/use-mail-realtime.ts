"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** One delayed refresh after push; follow-up catches Gmail indexing lag. */
const INBOX_REFRESH_DELAYS_MS = [1_500, 5_000] as const;
/** Min gap between inbox refresh bursts — avoids webhook spam. */
const INBOX_REFRESH_COOLDOWN_MS = 5_000;
const CALENDAR_REFRESH_DELAYS_MS = [0, 2_000] as const;

const MAIL_INBOX_TOAST_ID = "mail-inbox-sync";

const SHARED_KEY = "__mailPilotMailRealtimeShared__" as const;
const SUPPRESS_UNTIL_KEY = "__mailPilotSuppressInboxNotifyUntil__" as const;
const SUPPRESS_REFRESH_UNTIL_KEY = "__mailPilotSuppressInboxRefreshUntil__" as const;
const KNOWN_THREADS_KEY = "__mailPilotKnownInboxThreads__" as const;
const LAST_NOTIFY_AT_KEY = "__mailPilotLastInboxNotifyAt__" as const;
const LAST_INBOX_REFRESH_AT_KEY = "__mailPilotLastInboxRefreshAt__" as const;
const PENDING_INBOX_REFRESH_KEY = "__mailPilotPendingInboxRefresh__" as const;
const INBOX_SEEDED_KEY = "__mailPilotInboxSeeded__" as const;
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
  [SUPPRESS_REFRESH_UNTIL_KEY]?: number;
  [KNOWN_THREADS_KEY]?: Set<string>;
  [LAST_NOTIFY_AT_KEY]?: number;
  [LAST_INBOX_REFRESH_AT_KEY]?: number;
  [PENDING_INBOX_REFRESH_KEY]?: boolean;
  [INBOX_SEEDED_KEY]?: boolean;
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

function isInboxSeeded(): boolean {
  return (globalThis as GlobalStore)[INBOX_SEEDED_KEY] ?? false;
}

/** Skip list refresh after trash/send (Gmail webhooks still fire). */
export function suppressInboxRefreshForMs(ms: number): void {
  const store = globalThis as GlobalStore;
  const until = Date.now() + ms;
  store[SUPPRESS_REFRESH_UNTIL_KEY] = Math.max(
    store[SUPPRESS_REFRESH_UNTIL_KEY] ?? 0,
    until,
  );
}

export function isInboxRefreshSuppressed(): boolean {
  return (
    Date.now() < ((globalThis as GlobalStore)[SUPPRESS_REFRESH_UNTIL_KEY] ?? 0)
  );
}

/** Call after loading the inbox list so webhooks only toast on genuinely new threads. */
export function seedKnownInboxThreads(threadIds: Iterable<string>): void {
  const known = getKnownThreadIds();
  for (const id of threadIds) known.add(id);
  (globalThis as GlobalStore)[INBOX_SEEDED_KEY] = true;
}

export function forgetKnownInboxThread(threadId: string): void {
  getKnownThreadIds().delete(threadId);
}

/** Prevent restore/untrash from triggering a "new mail" toast. */
export function markKnownInboxThread(threadId: string): void {
  getKnownThreadIds().add(threadId);
  (globalThis as GlobalStore)[INBOX_SEEDED_KEY] = true;
}

function isInboxNotifySuppressed(): boolean {
  return Date.now() < ((globalThis as GlobalStore)[SUPPRESS_UNTIL_KEY] ?? 0);
}

function fireInboxRefresh() {
  if (isInboxRefreshSuppressed()) return;
  (globalThis as GlobalStore)[LAST_INBOX_REFRESH_AT_KEY] = Date.now();
  (globalThis as GlobalStore)[PENDING_INBOX_REFRESH_KEY] = undefined;
  window.dispatchEvent(new Event(MAIL_INBOX_CHANGED_EVENT));
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

function scheduleThrottledInboxRefresh(timers: number[]) {
  const store = globalThis as GlobalStore;
  const now = Date.now();
  const lastAt = store[LAST_INBOX_REFRESH_AT_KEY] ?? 0;
  const elapsed = now - lastAt;

  for (const id of timers) window.clearTimeout(id);
  timers.length = 0;

  if (elapsed >= INBOX_REFRESH_COOLDOWN_MS) {
    for (const delay of INBOX_REFRESH_DELAYS_MS) {
      timers.push(window.setTimeout(fireInboxRefresh, delay));
    }
    return;
  }

  if (store[PENDING_INBOX_REFRESH_KEY]) return;

  store[PENDING_INBOX_REFRESH_KEY] = true;
  const wait = INBOX_REFRESH_COOLDOWN_MS - elapsed;
  timers.push(
    window.setTimeout(() => {
      fireInboxRefresh();
      timers.push(
        window.setTimeout(
          fireInboxRefresh,
          INBOX_REFRESH_DELAYS_MS[1] - INBOX_REFRESH_DELAYS_MS[0],
        ),
      );
    }, wait + INBOX_REFRESH_DELAYS_MS[0]),
  );
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
        scheduleThrottledInboxRefresh(current.inboxTimers);
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
    return () => releaseSharedConnection();
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

  const checkForNewMail = useCallback(async () => {
    if (isInboxRefreshSuppressed()) return;

    try {
      const threads = await fetchRef.current();
      const known = getKnownThreadIds();
      const ids = threads.map((t) => t.threadId);

      if (!isInboxSeeded()) {
        seedKnownInboxThreads(ids);
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
        if (!isViewingRef.current) {
          setCount((current) => current + added);
        }
      }
    } catch {
      // ignore fetch errors during background sync
    }
  }, []);

  useMailRealtimeInbox(checkForNewMail);

  useEffect(() => {
    if (isViewingInbox) {
      setCount(0);
    }
  }, [isViewingInbox]);

  // Seed when on Agent/Calendar so the first webhook doesn't false-positive.
  useEffect(() => {
    if (isViewingInbox) return;
    void checkForNewMail();
  }, [checkForNewMail, isViewingInbox]);

  return isViewingInbox ? 0 : count;
}
