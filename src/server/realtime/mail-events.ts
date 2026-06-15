import "server-only";

export type MailRealtimeEvent =
  | { type: "connected" }
  | { type: "inbox_changed"; plugin: "gmail" };

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
  notifyMailInboxChangedForTenants([tenantId]);
}

export function notifyMailInboxChangedForTenants(tenantIds: string[]): void {
  const registry = getListenerRegistry();
  const event: MailRealtimeEvent = {
    type: "inbox_changed",
    plugin: "gmail",
  };

  let delivered = 0;
  for (const tenantId of tenantIds) {
    const listeners = registry.get(tenantId);
    if (!listeners?.size) continue;
    delivered += listeners.size;
    for (const listener of listeners) {
      listener(event);
    }
  }

  if (delivered === 0) {
    const active = mailRealtimeActiveTenantIds();
    console.warn(
      `[mail:realtime] No SSE listeners for webhook tenant(s) [${tenantIds.join(", ")}]. ` +
        `Active SSE tenant(s): [${active.join(", ") || "none"}]. ` +
        `Usually a sign-in / Gmail-connect mismatch — reconnect Gmail at /api/corsair/connect?plugin=gmail while signed in.`,
    );
  }
}
