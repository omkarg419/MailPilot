import "server-only";

import { decodePubSubMessage } from "@corsair-dev/gmail";
import { sql } from "drizzle-orm";

import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { corsair } from "@/server/corsair";
import {
  accountPluginKeys,
  getPluginAccessToken,
} from "@/server/oauth/google-access-token";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";

/** Account-level keys live on `withTenant(id).gmail.keys`. */
function gmailIntegrationKeys() {
  return (
    (corsair as { keys?: { gmail?: ReturnType<typeof accountPluginKeys> } }).keys
      ?.gmail ?? {}
  );
}

async function getGmailAccessToken(
  tenantId: string,
  forceRefresh = false,
): Promise<string> {
  return getPluginAccessToken({
    tenantId,
    pluginLabel: "Gmail",
    integrationKeys: gmailIntegrationKeys(),
    accountKeys: accountPluginKeys(corsair.withTenant(tenantId).gmail),
    forceRefresh,
  });
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

  let accessToken = await getGmailAccessToken(tenantId);
  let response = await fetch(`${GMAIL_API_BASE}/users/me/watch`, {
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

  if (response.status === 401) {
    accessToken = await getGmailAccessToken(tenantId, true);
    response = await fetch(`${GMAIL_API_BASE}/users/me/watch`, {
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
  }

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
