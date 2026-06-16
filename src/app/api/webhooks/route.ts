import { processWebhook } from "corsair";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { corsair } from "@/server/corsair";
import {
  notifyCalendarChangedForTenants,
  notifyMailInboxChangedForTenants,
} from "@/server/realtime/mail-events";
import {
  resolveWebhookNotifyTenantIds,
  resolveWebhookTenantId,
} from "@/server/webhooks/resolve-tenant";

async function parseWebhookBody(
  request: NextRequest,
): Promise<string | Record<string, unknown>> {
  const text = await request.text();
  const trimmed = text.trim();
  if (!trimmed) return {};

  const contentType = request.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    try {
      return JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      console.warn("[webhooks] Invalid JSON body");
      return {};
    }
  }

  return text;
}

export async function POST(request: NextRequest) {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let body: string | Record<string, unknown>;

  body = await parseWebhookBody(request);

  const tenantId = await resolveWebhookTenantId(body, headers);
  if (!tenantId) {
    console.warn("[webhooks] Could not resolve tenant from payload");
    return NextResponse.json(
      {
        success: false,
        message: "Could not resolve tenant for this webhook",
      },
      { status: 400 },
    );
  }

  const result = await processWebhook(corsair, headers, body, { tenantId });

  console.info(
    "Plugin Processed:",
    result.plugin,
    result.action,
    "tenant:",
    tenantId,
  );

  if (result.plugin === "gmail") {
    const notifyTenantIds = await resolveWebhookNotifyTenantIds(body);
    notifyMailInboxChangedForTenants([
      ...new Set([tenantId, ...notifyTenantIds]),
    ]);
  } else if (result.plugin === "googlecalendar") {
    const resourceState =
      headers["x-goog-resource-state"] ?? headers["X-Goog-Resource-State"];
    // Google sends a one-time "sync" ping when a watch channel is created.
    if (resourceState !== "sync") {
      notifyCalendarChangedForTenants([tenantId]);
    }
  }

  const responseHeaders = result.responseHeaders;
  const nextHeaders = new Headers();
  if (responseHeaders) {
    for (const [key, value] of Object.entries(responseHeaders)) {
      nextHeaders.set(key, value);
    }
  }

  if (!result.response) {
    return NextResponse.json(
      {
        success: false,
        message: "No matching webhook handler found",
      },
      { status: 404 },
    );
  }

  if (result.response !== undefined) {
    return NextResponse.json(result.response, { headers: nextHeaders });
  }

  return new NextResponse(null, { status: 200, headers: nextHeaders });
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
