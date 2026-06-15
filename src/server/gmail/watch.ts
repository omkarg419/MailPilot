import "server-only";

import { decodePubSubMessage } from "@corsair-dev/gmail";
import { sql } from "drizzle-orm";

import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { corsair } from "@/server/corsair";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";
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

/** Account-level keys live on `withTenant(id).gmail.keys`. */
function accountPluginKeys(client: unknown): PluginKeys {
  if (client == null || typeof client !== "object") return {};
  return (client as { keys?: PluginKeys }).keys ?? {};
}

/** Integration-level keys live on `corsair.keys.gmail` (multi-tenant). */
function gmailIntegrationKeys(): PluginKeys {
  const keys = (corsair as { keys?: { gmail?: PluginKeys } }).keys?.gmail;
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
    throw new Error(`Failed to refresh Gmail access token: ${error}`);
  }

  return (await response.json()) as { access_token: string; expires_in: number };
}

async function getGmailAccessToken(tenantId: string): Promise<string> {
  const integrationKeys = gmailIntegrationKeys();
  const accountKeys = accountPluginKeys(corsair.withTenant(tenantId).gmail);

  const clientId = await integrationKeys.get_client_id?.();
  const clientSecret = await integrationKeys.get_client_secret?.();
  const refreshToken = await accountKeys.get_refresh_token?.();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Gmail OAuth credentials are missing for this tenant. Reconnect Gmail.",
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

export type GmailWatchResult = {
  historyId: string;
  expiration: string;
};

/** Register Gmail → Pub/Sub push for the tenant's connected inbox. */
export async function setupGmailWatch(
  tenantId: string,
): Promise<GmailWatchResult | null> {
  const topicName = process.env.GMAIL_PUBSUB_TOPIC?.trim();
  if (!topicName) {
    console.warn(
      "[gmail:watch] GMAIL_PUBSUB_TOPIC is not set — skipping Gmail watch setup.",
    );
    return null;
  }

  const accessToken = await getGmailAccessToken(tenantId);

  const response = await fetch(`${GMAIL_API_BASE}/users/me/watch`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topicName,
      labelIds: ["INBOX"],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gmail watch failed: ${error}`);
  }

  const data = (await response.json()) as {
    historyId?: string;
    expiration?: string;
  };

  console.info(
    `[gmail:watch] Started for tenant ${tenantId} → ${topicName} (expires ${data.expiration ?? "unknown"})`,
  );

  return {
    historyId: data.historyId ?? "",
    expiration: data.expiration ?? "",
  };
}

function extractGmailPushEmail(
  body: string | Record<string, unknown>,
): string | null {
  if (typeof body === "string" || !body || typeof body !== "object") {
    return null;
  }

  const message = body.message;
  if (!message || typeof message !== "object") return null;

  const data = (message as { data?: string }).data;
  if (!data) return null;

  try {
    const push = decodePubSubMessage(data);
    return push.emailAddress?.trim().toLowerCase() ?? null;
  } catch {
    return null;
  }
}

async function findUserIdsForEmail(email: string): Promise<string[]> {
  const rows = await db.query.users.findMany({
    where: sql`lower(${users.email}) = ${email}`,
    columns: { id: true },
  });
  return rows.map((row) => row.id);
}

async function filterTenantsWithGmailConnected(
  tenantIds: string[],
): Promise<string[]> {
  const connected: string[] = [];
  for (const tenantId of tenantIds) {
    const status = await corsair.manage.connectionStatus.get({ tenantId });
    if (status.gmail === "connected") {
      connected.push(tenantId);
    }
  }
  return connected;
}

/** Tenants that should receive inbox SSE updates for this Gmail address. */
export async function resolveGmailNotifyTenantIds(
  body: string | Record<string, unknown>,
): Promise<string[]> {
  const email = extractGmailPushEmail(body);
  if (!email) return [];

  const userIds = await findUserIdsForEmail(email);
  if (userIds.length === 0) return [];

  const connected = await filterTenantsWithGmailConnected(userIds);
  return connected.length > 0 ? connected : userIds;
}

/** Map a Gmail Pub/Sub notification to the NextAuth user id (Corsair tenant). */
export async function resolveTenantIdFromGmailWebhook(
  body: string | Record<string, unknown>,
): Promise<string | null> {
  const tenantIds = await resolveGmailNotifyTenantIds(body);
  return tenantIds[0] ?? null;
}
