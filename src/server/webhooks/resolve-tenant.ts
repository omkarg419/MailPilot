import "server-only";

import { resolveTenantIdFromCalendarChannel } from "@/server/calendar/watch";
import {
  resolveGmailNotifyTenantIds,
  resolveTenantIdFromGmailWebhook,
} from "@/server/gmail/watch";

export async function resolveWebhookTenantId(
  body: string | Record<string, unknown>,
  headers?: Record<string, string>,
): Promise<string | null> {
  const fromGmail = await resolveTenantIdFromGmailWebhook(body);
  if (fromGmail) return fromGmail;

  const channelId =
    headers?.["x-goog-channel-id"] ?? headers?.["X-Goog-Channel-Id"];
  return resolveTenantIdFromCalendarChannel(channelId);
}

export async function resolveWebhookNotifyTenantIds(
  body: string | Record<string, unknown>,
): Promise<string[]> {
  return resolveGmailNotifyTenantIds(body);
}
