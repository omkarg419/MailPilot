import "server-only";

import { corsair } from "@/server/corsair";

const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

type PluginKeys = {
  get_client_id?: () => Promise<string | null>;
  get_client_secret?: () => Promise<string | null>;
  get_refresh_token?: () => Promise<string | null>;
  get_access_token?: () => Promise<string | null>;
  get_expires_at?: () => Promise<string | null>;
  set_access_token?: (value: string | null) => Promise<void>;
  set_expires_at?: (value: string | null) => Promise<void>;
};

function accountPluginKeys(client: unknown): PluginKeys {
  if (client == null || typeof client !== "object") return {};
  return (client as { keys?: PluginKeys }).keys ?? {};
}

function calendarIntegrationKeys(): PluginKeys {
  const keys = (corsair as { keys?: { googlecalendar?: PluginKeys } }).keys
    ?.googlecalendar;
  return keys ?? {};
}

async function refreshGoogleAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh Calendar access token: ${error}`);
  }

  return (await response.json()) as { access_token: string; expires_in: number };
}

async function getCalendarAccessToken(tenantId: string): Promise<string> {
  const integrationKeys = calendarIntegrationKeys();
  const accountKeys = accountPluginKeys(
    corsair.withTenant(tenantId).googlecalendar,
  );

  const clientId = await integrationKeys.get_client_id?.();
  const clientSecret = await integrationKeys.get_client_secret?.();
  const refreshToken = await accountKeys.get_refresh_token?.();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google Calendar OAuth credentials are missing for this tenant. Reconnect Calendar.",
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const accessToken = await accountKeys.get_access_token?.();
  const expiresAtRaw = await accountKeys.get_expires_at?.();
  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : 0;

  if (accessToken && expiresAt > now + 300) {
    return accessToken;
  }

  const refreshed = await refreshGoogleAccessToken(
    clientId,
    clientSecret,
    refreshToken,
  );

  await accountKeys.set_access_token?.(refreshed.access_token);
  await accountKeys.set_expires_at?.(String(now + refreshed.expires_in));

  return refreshed.access_token;
}

export type CalendarWatchResult = {
  channelId: string;
  resourceId: string;
  expiration: string;
};

/** Register Calendar → webhook push for the tenant's primary calendar. */
export async function setupCalendarWatch(
  tenantId: string,
): Promise<CalendarWatchResult | null> {
  const appUrl = process.env.APP_URL?.trim();
  if (!appUrl) {
    console.warn(
      "[calendar:watch] APP_URL is not set — skipping Calendar watch setup.",
    );
    return null;
  }

  const accessToken = await getCalendarAccessToken(tenantId);
  const channelId = `${tenantId}.${crypto.randomUUID()}`;
  const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/webhooks`;

  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/primary/events/watch`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: channelId,
        type: "web_hook",
        address: webhookUrl,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Calendar watch failed: ${error}`);
  }

  const data = (await response.json()) as {
    resourceId?: string;
    expiration?: string;
  };

  console.info(
    `[calendar:watch] Started for tenant ${tenantId} → ${webhookUrl} (expires ${data.expiration ?? "unknown"})`,
  );

  return {
    channelId,
    resourceId: data.resourceId ?? "",
    expiration: data.expiration ?? "",
  };
}

const UUID_PREFIX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Parse tenant id embedded in Calendar channel id (`{tenantId}.{uuid}`). */
export function resolveTenantIdFromCalendarChannel(
  channelId: string | null | undefined,
): string | null {
  if (!channelId) return null;
  const match = channelId.match(UUID_PREFIX);
  return match?.[0] ?? null;
}
