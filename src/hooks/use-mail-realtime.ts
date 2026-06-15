"use client";

import { useEffect, useRef } from "react";

/** Gmail push often arrives before threads.list includes the new message. */
const REFRESH_DELAYS_MS = [0, 1_500, 4_000] as const;

export const MAIL_INBOX_CHANGED_EVENT = "mailpilot:inbox_changed";

/** Opens the SSE stream as early as possible (e.g. mail page loader). */
export function useMailRealtimeConnection() {
  useEffect(() => {
    const source = new EventSource("/api/mail/events");
    const timers: number[] = [];

    const scheduleRefreshSignals = () => {
      for (const delay of REFRESH_DELAYS_MS) {
        timers.push(
          window.setTimeout(() => {
            window.dispatchEvent(new Event(MAIL_INBOX_CHANGED_EVENT));
          }, delay),
        );
      }
    };

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { type?: string };
        if (data.type === "inbox_changed") {
          scheduleRefreshSignals();
        }
      } catch {
        // ignore malformed SSE payloads
      }
    };

    source.onerror = () => {
      // EventSource reconnects automatically; clear pending refresh timers.
      for (const id of timers) window.clearTimeout(id);
      timers.length = 0;
    };

    return () => {
      source.close();
      for (const id of timers) window.clearTimeout(id);
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
