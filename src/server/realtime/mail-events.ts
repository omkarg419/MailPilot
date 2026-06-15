import "server-only";

export type MailRealtimeEvent =
  | { type: "connected" }
  | { type: "inbox_changed"; plugin: "gmail" }
  | { type: "calendar_changed"; plugin: "googlecalendar" };

type MailRealtimeListener = (event: MailRealtimeEvent) => void;

const LISTENERS_KEY = "__mailPilotRealtimeListeners__" as const;
const NOTIFY_DEBOUNCE_KEY = "__mailPilotNotifyDebounce__" as const;

/** Min gap between SSE pushes per tenant (Gmail can spam webhooks). */
const SSE_NOTIFY_MIN_INTERVAL_MS = 30_000;

function getNotifyDebounceMap(): Map<string, number> {
  const globalStore = globalThis as typeof globalThis & {
    [NOTIFY_DEBOUNCE_KEY]?: Map<string, number>;
  };
  globalStore[NOTIFY_DEBOUNCE_KEY] ??= new Map();
  return globalStore[NOTIFY_DEBOUNCE_KEY];
}

function shouldDeliverSseNotify(tenantId: string, eventType: string): boolean {
  const key = `${tenantId}:${eventType}`;
  const debounce = getNotifyDebounceMap();
  const lastAt = debounce.get(key) ?? 0;
  if (Date.now() - lastAt < SSE_NOTIFY_MIN_INTERVAL_MS) return false;
  debounce.set(key, Date.now());
  return true;
}

function getListenerRegistry(): Map<string, Set<MailRealtimeListener>> {
  const globalStore = globalThis as typeof globalThis & {
    [LISTENERS_KEY]?: Map<string, Set<MailRealtimeListener>>;
  };
  globalStore[LISTENERS_KEY] ??= new Map();
  return globalStore[LISTENERS_KEY];
}

export function subscribeMailRealtime(
  tenantId: string,
  listener: MailRealtimeListener,
): () => void {
  const registry = getListenerRegistry();
  let set = registry.get(tenantId);
  if (!set) {
    set = new Set();
    registry.set(tenantId, set);
  }
  set.add(listener);
  return () => {
    set.delete(listener);
    if (set.size === 0) {
      registry.delete(tenantId);
    }
  };
}

export function mailRealtimeListenerCount(tenantId: string): number {
  return getListenerRegistry().get(tenantId)?.size ?? 0;
}

export function mailRealtimeActiveTenantIds(): string[] {
  return [...getListenerRegistry().keys()];
}

export function encodeMailSseEvent(event: MailRealtimeEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function notifyMailInboxChanged(tenantId: string): void {
  notifyRealtimeForTenants([tenantId], {
    type: "inbox_changed",
    plugin: "gmail",
  });
}

export function notifyCalendarChangedForTenants(tenantIds: string[]): void {
  notifyRealtimeForTenants(tenantIds, {
    type: "calendar_changed",
    plugin: "googlecalendar",
  });
}

export function notifyMailInboxChangedForTenants(tenantIds: string[]): void {
  notifyRealtimeForTenants(tenantIds, {
    type: "inbox_changed",
    plugin: "gmail",
  });
}

function notifyRealtimeForTenants(
  tenantIds: string[],
  event: MailRealtimeEvent,
): void {
  const registry = getListenerRegistry();
  let delivered = 0;
  const uniqueTenantIds = [...new Set(tenantIds)];

  for (const tenantId of uniqueTenantIds) {
    const listeners = registry.get(tenantId);
    if (!listeners?.size) continue;
    if (!shouldDeliverSseNotify(tenantId, event.type)) continue;
    delivered += listeners.size;
    for (const listener of listeners) {
      listener(event);
    }
  }

  if (delivered === 0) {
    const active = mailRealtimeActiveTenantIds();
    console.warn(
      `[mail:realtime] No SSE listeners for webhook tenant(s) [${tenantIds.join(", ")}] ` +
        `(event: ${event.type}). Active SSE tenant(s): [${active.join(", ") || "none"}]. ` +
        `Usually a sign-in / connect mismatch — reconnect at /api/corsair/connect?plugin=... while signed in.`,
    );
  }
}
