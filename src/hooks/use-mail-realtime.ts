"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** Gmail push often arrives before threads.list includes the new message. */
const INBOX_REFRESH_DELAYS_MS = [0, 1_500, 4_000] as const;
const CALENDAR_REFRESH_DELAYS_MS = [0, 2_000] as const;

export const MAIL_INBOX_CHANGED_EVENT = "mailpilot:inbox_changed";
export const CALENDAR_CHANGED_EVENT = "mailpilot:calendar_changed";

type SharedConnection = {
  source: EventSource;
  refCount: number;
  inboxTimers: number[];
  calendarTimers: number[];
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
  };

  source.onmessage = (event) => {
    if (!shared) return;

    try {
      const data = JSON.parse(event.data) as { type?: string };
      if (data.type === "inbox_changed") {
        toast.info("New mail received", { description: "Syncing your inbox…" });
        for (const id of shared.inboxTimers) window.clearTimeout(id);
        shared.inboxTimers.length = 0;
        dispatchRefreshSignals(
          MAIL_INBOX_CHANGED_EVENT,
          INBOX_REFRESH_DELAYS_MS,
          shared.inboxTimers,
        );
      } else if (data.type === "calendar_changed") {
        toast.info("Calendar updated", { description: "Syncing events…" });
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
    const onChanged = () => {
      setCount((current) => current + 1);
    };
    window.addEventListener(MAIL_INBOX_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(MAIL_INBOX_CHANGED_EVENT, onChanged);
  }, []);

  useEffect(() => {
    if (isViewingInbox) setCount(0);
  }, [isViewingInbox]);

  return isViewingInbox ? 0 : count;
}
