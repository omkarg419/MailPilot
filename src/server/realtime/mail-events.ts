import "server-only";

export type MailRealtimeEvent =
  | { type: "connected" }
  | { type: "inbox_changed"; plugin: "gmail" }
  | { type: "calendar_changed"; plugin: "googlecalendar" };

type MailRealtimeListener = (event: MailRealtimeEvent) => void;

const LISTENERS_KEY = "__mailPilotRealtimeListeners__" as const;

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
  notifyRealtimeForTenants(
    tenantIds,
    {
      type: "inbox_changed",
      plugin: "gmail",
    },
    { fanOutActiveOnMiss: true },
  );
}

function notifyRealtimeForTenants(
  tenantIds: string[],
  event: MailRealtimeEvent,
  options?: { fanOutActiveOnMiss?: boolean },
): void {
  const registry = getListenerRegistry();
  let delivered = 0;
  const uniqueTenantIds = [...new Set(tenantIds.filter(Boolean))];

  for (const tenantId of uniqueTenantIds) {
    const listeners = registry.get(tenantId);
    if (!listeners?.size) continue;
    delivered += listeners.size;
    for (const listener of listeners) {
      listener(event);
    }
  }

  if (delivered > 0) return;

  const active = mailRealtimeActiveTenantIds();
  if (options?.fanOutActiveOnMiss && active.length > 0) {
    for (const tenantId of active) {
      const listeners = registry.get(tenantId);
      if (!listeners?.size) continue;
      delivered += listeners.size;
      for (const listener of listeners) {
        listener(event);
      }
    }
    if (delivered > 0) {
      console.info(
        `[mail:realtime] Webhook tenant(s) [${uniqueTenantIds.join(", ") || "none"}] had no SSE listeners; ` +
          `fanned out ${event.type} to active session(s) [${active.join(", ")}].`,
      );
      return;
    }
  }

  console.warn(
    `[mail:realtime] No SSE listeners for webhook tenant(s) [${uniqueTenantIds.join(
      ", ",
    )}] ` +
      `(event: ${event.type}). Active SSE tenant(s): [${
        active.join(", ") || "none"
      }]. ` +
      `Sign in with the Gmail account that receives webhooks, then reconnect at /api/corsair/connect?plugin=gmail.`,
  );
}
