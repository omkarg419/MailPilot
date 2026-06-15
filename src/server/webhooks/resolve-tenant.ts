import "server-only";

import {
  resolveGmailNotifyTenantIds,
  resolveTenantIdFromGmailWebhook,
} from "@/server/gmail/watch";

export async function resolveWebhookTenantId(
  body: string | Record<string, unknown>,
): Promise<string | null> {
  return resolveTenantIdFromGmailWebhook(body);
}

export async function resolveWebhookNotifyTenantIds(
  body: string | Record<string, unknown>,
): Promise<string[]> {
  return resolveGmailNotifyTenantIds(body);
}
