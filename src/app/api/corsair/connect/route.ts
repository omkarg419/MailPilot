import { NextResponse, type NextRequest } from "next/server";
import { generateOAuthUrl } from "corsair/oauth";

import { corsair } from "@/server/corsair";
import { auth } from "@/server/auth";

const REDIRECT_URI = `${process.env.APP_URL}/api/corsair/callback`;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plugin = request.nextUrl.searchParams.get("plugin") ?? "gmail";

  const { url } = await generateOAuthUrl(corsair, plugin, {
    tenantId: session.user.id,
    redirectUri: REDIRECT_URI,
  });

  return NextResponse.redirect(url);
}
