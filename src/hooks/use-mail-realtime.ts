"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** Gmail push often arrives before threads.list includes the new message. */
const INBOX_REFRESH_DELAYS_MS = [0, 1_500, 4_000] as const;
const CALENDAR_REFRESH_DELAYS_MS = [0, 2_000] as const;

/** Collapse duplicate Gmail webhooks into one toast/badge per burst. */
const NOTIFY_DEBOUNCE_MS = 5_000;

const MAIL_INBOX_TOAST_ID = "mail-inbox-sync";
const CALENDAR_TOAST_ID = "calendar-sync";

/** Background inbox refresh (may fire multiple times per webhook burst). */
export const MAIL_INBOX_CHANGED_EVENT = "mailpilot:inbox_changed";
/** User-visible notify (toast + badge), debounced once per burst. */
export const MAIL_INBOX_NOTIFY_EVENT = "mailpilot:inbox_notify";
export const CALENDAR_CHANGED_EVENT = "mailpilot:calendar_changed";
export const CALENDAR_NOTIFY_EVENT = "mailpilot:calendar_notify";

type SharedConnection = {
  source: EventSource;
  refCount: number;
  inboxTimers: number[];
  calendarTimers: number[];
  lastInboxNotifyAt: number;
  lastCalendarNotifyAt: number;
};

let shared: SharedConnection | null = null;

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

function shouldNotify(lastAt: number): boolean {
  return Date.now() - lastAt >= NOTIFY_DEBOUNCE_MS;
}

function notifyInboxBurst(connection: SharedConnection) {
  if (!shouldNotify(connection.lastInboxNotifyAt)) return;
  connection.lastInboxNotifyAt = Date.now();
  toast.info("New mail received", {
    id: MAIL_INBOX_TOAST_ID,
    description: "Syncing your inbox…",
  });
  window.dispatchEvent(new Event(MAIL_INBOX_NOTIFY_EVENT));
}

function notifyCalendarBurst(connection: SharedConnection) {
  if (!shouldNotify(connection.lastCalendarNotifyAt)) return;
  connection.lastCalendarNotifyAt = Date.now();
  toast.info("Calendar updated", {
    id: CALENDAR_TOAST_ID,
    description: "Syncing events…",
  });
  window.dispatchEvent(new Event(CALENDAR_NOTIFY_EVENT));
}

function acquireSharedConnection(): SharedConnection {
  if (shared) {
    shared.refCount += 1;
    return shared;
  }

  const source = new EventSource("/api/mail/events");
  shared = {
    source,
    refCount: 1,
    inboxTimers: [],
    calendarTimers: [],
    lastInboxNotifyAt: 0,
    lastCalendarNotifyAt: 0,
  };

  source.onmessage = (event) => {
    if (!shared) return;

    try {
      const data = JSON.parse(event.data) as { type?: string };
      if (data.type === "inbox_changed") {
        notifyInboxBurst(shared);
        for (const id of shared.inboxTimers) window.clearTimeout(id);
        shared.inboxTimers.length = 0;
        dispatchRefreshSignals(
          MAIL_INBOX_CHANGED_EVENT,
          INBOX_REFRESH_DELAYS_MS,
          shared.inboxTimers,
        );
      } else if (data.type === "calendar_changed") {
        notifyCalendarBurst(shared);
        for (const id of shared.calendarTimers) window.clearTimeout(id);
        shared.calendarTimers.length = 0;
        dispatchRefreshSignals(
          CALENDAR_CHANGED_EVENT,
          CALENDAR_REFRESH_DELAYS_MS,
          shared.calendarTimers,
        );
      }
    } catch {
      // ignore malformed SSE payloads
    }
  };

  source.onerror = () => {
    if (!shared) return;
    for (const id of shared.inboxTimers) window.clearTimeout(id);
    for (const id of shared.calendarTimers) window.clearTimeout(id);
    shared.inboxTimers.length = 0;
    shared.calendarTimers.length = 0;
  };

  return shared;
}

function releaseSharedConnection() {
  if (!shared) return;
  shared.refCount -= 1;
  if (shared.refCount > 0) return;

  for (const id of shared.inboxTimers) window.clearTimeout(id);
  for (const id of shared.calendarTimers) window.clearTimeout(id);
  shared.source.close();
  shared = null;
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

/** Badge count for new inbox activity while not viewing INBOX. */
export function useInboxNewCount(isViewingInbox: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const onNotify = () => {
      setCount((current) => current + 1);
    };
    window.addEventListener(MAIL_INBOX_NOTIFY_EVENT, onNotify);
    return () => window.removeEventListener(MAIL_INBOX_NOTIFY_EVENT, onNotify);
  }, []);

  useEffect(() => {
    if (isViewingInbox) setCount(0);
  }, [isViewingInbox]);

  return isViewingInbox ? 0 : count;
}
