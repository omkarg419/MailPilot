import { NextResponse, type NextRequest } from "next/server";
import { processOAuthCallback } from "corsair/oauth";

import { corsair } from "@/server/corsair";
import { setupGmailWatch } from "@/server/gmail/watch";

const REDIRECT_URI = `${process.env.APP_URL}/api/corsair/callback`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state" },
      { status: 400 },
    );
  }

  try {
    const result = await processOAuthCallback(corsair, {
      code,
      state,
      redirectUri: REDIRECT_URI,
    });

    if (result.plugin === "gmail") {
      try {
        await setupGmailWatch(result.tenantId);
      } catch (watchError) {
        console.error(
          `[gmail:watch] Auto-setup failed for tenant ${result.tenantId}:`,
          watchError,
        );
      }
    }
  } catch (error) {
    console.error("Corsair OAuth callback failed:", error);
    return NextResponse.json({ error: "OAuth callback failed" }, { status: 400 });
  }

  return NextResponse.redirect(new URL("/connect", process.env.APP_URL));
}
