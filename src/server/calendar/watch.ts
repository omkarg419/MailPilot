import "server-only";

import { corsair } from "@/server/corsair";
import {
  accountPluginKeys,
  getPluginAccessToken,
} from "@/server/oauth/google-access-token";

const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

function calendarIntegrationKeys() {
  return (
    (corsair as { keys?: { googlecalendar?: ReturnType<typeof accountPluginKeys> } })
      .keys?.googlecalendar ?? {}
  );
}

async function getCalendarAccessToken(
  tenantId: string,
  forceRefresh = false,
): Promise<string> {
  return getPluginAccessToken({
    tenantId,
    pluginLabel: "Google Calendar",
    integrationKeys: calendarIntegrationKeys(),
    accountKeys: accountPluginKeys(
      corsair.withTenant(tenantId).googlecalendar,
    ),
    forceRefresh,
  });
}

export type CalendarWatchResult = {
  channelId: string;
  resourceId: string;
  expiration: string;
};

export class CalendarWatchConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalendarWatchConfigError";
  }
}

const CALENDAR_HTTPS_HELP =
  "Calendar push requires HTTPS. For local dev: run `ngrok http 3000`, set APP_URL to the https://… URL in `.env`, then restart the dev server.";

/** Webhook URL Google Calendar will call — must be HTTPS. */
export function resolveCalendarWebhookUrl(): string {
  const appUrl = process.env.APP_URL?.trim();
  if (!appUrl) {
    throw new CalendarWatchConfigError("APP_URL is not configured in `.env`.");
  }

  let parsed: URL;
  try {
    parsed = new URL(appUrl);
  } catch {
    throw new CalendarWatchConfigError("APP_URL is not a valid URL.");
  }

  if (parsed.protocol !== "https:") {
    throw new CalendarWatchConfigError(CALENDAR_HTTPS_HELP);
  }

  return `${appUrl.replace(/\/$/, "")}/api/webhooks`;
}

function parseCalendarWatchApiError(errorBody: string): string | null {
  try {
    const data = JSON.parse(errorBody) as {
      error?: {
        message?: string;
        errors?: { reason?: string }[];
      };
    };
    const reasons = data.error?.errors?.map((e) => e.reason) ?? [];
    if (
      reasons.includes("push.webhookUrlNotHttps") ||
      data.error?.message?.includes("WebHook callback must be HTTPS")
    ) {
      return CALENDAR_HTTPS_HELP;
    }
  } catch {
    // not JSON
  }
  return null;
}

async function registerCalendarWatch(
  accessToken: string,
  channelId: string,
  webhookUrl: string,
): Promise<Response> {
  return fetch(`${CALENDAR_API_BASE}/calendars/primary/events/watch`, {
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
  });
}

/** Register Calendar → webhook push for the tenant's primary calendar. */
export async function setupCalendarWatch(
  tenantId: string,
  options?: { strict?: boolean },
): Promise<CalendarWatchResult | null> {
  let webhookUrl: string;
  try {
    webhookUrl = resolveCalendarWebhookUrl();
  } catch (err) {
    if (err instanceof CalendarWatchConfigError) {
      if (options?.strict) throw err;
      console.warn(`[calendar:watch] ${err.message}`);
      return null;
    }
    throw err;
  }

  const channelId = `${tenantId}.${crypto.randomUUID()}`;
  let accessToken = await getCalendarAccessToken(tenantId);
  let response = await registerCalendarWatch(
    accessToken,
    channelId,
    webhookUrl,
  );

  if (response.status === 401) {
    accessToken = await getCalendarAccessToken(tenantId, true);
    response = await registerCalendarWatch(
      accessToken,
      channelId,
      webhookUrl,
    );
  }

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 401) {
      throw new Error(
        `Calendar watch failed: invalid OAuth credentials. Reconnect Google Calendar at /api/corsair/connect?plugin=googlecalendar. (${error})`,
      );
    }
    const configMessage = parseCalendarWatchApiError(error);
    if (configMessage) {
      throw new CalendarWatchConfigError(configMessage);
    }
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
