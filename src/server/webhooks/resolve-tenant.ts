import "server-only";

import { resolveTenantIdFromGmailWebhook } from "@/server/gmail/watch";

export async function resolveWebhookTenantId(
  body: string | Record<string, unknown>,
): Promise<string | null> {
  return resolveTenantIdFromGmailWebhook(body);
}
