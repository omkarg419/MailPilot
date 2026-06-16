import "server-only";

type PluginKeys = {
  get_client_id?: () => Promise<string | null>;
  get_client_secret?: () => Promise<string | null>;
  get_refresh_token?: () => Promise<string | null>;
  get_access_token?: () => Promise<string | null>;
  get_expires_at?: () => Promise<string | null>;
  set_access_token?: (value: string | null) => Promise<void>;
  set_expires_at?: (value: string | null) => Promise<void>;
};

const TOKEN_URL = "https://oauth2.googleapis.com/token";

/** Corsair may store epoch seconds or milliseconds — normalize to seconds. */
export function normalizeExpiresAtSeconds(
  expiresAtRaw: string | null | undefined,
): number {
  const raw = expiresAtRaw ? Number(expiresAtRaw) : 0;
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  if (raw > 1_000_000_000_000) return Math.floor(raw / 1000);
  return raw;
}

export function accountPluginKeys(client: unknown): PluginKeys {
  if (client == null || typeof client !== "object") return {};
  return (client as { keys?: PluginKeys }).keys ?? {};
}

async function refreshGoogleAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  label: string,
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
    throw new Error(`Failed to refresh ${label} access token: ${error}`);
  }

  return (await response.json()) as { access_token: string; expires_in: number };
}

export async function getPluginAccessToken(options: {
  tenantId: string;
  pluginLabel: string;
  integrationKeys: PluginKeys;
  accountKeys: PluginKeys;
  forceRefresh?: boolean;
}): Promise<string> {
  const { tenantId, pluginLabel, integrationKeys, accountKeys, forceRefresh } =
    options;

  const clientId = await integrationKeys.get_client_id?.();
  const clientSecret = await integrationKeys.get_client_secret?.();
  const refreshToken = await accountKeys.get_refresh_token?.();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      `${pluginLabel} OAuth credentials are missing for tenant ${tenantId}. Reconnect ${pluginLabel}.`,
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const accessToken = await accountKeys.get_access_token?.();
  const expiresAt = normalizeExpiresAtSeconds(
    await accountKeys.get_expires_at?.(),
  );

  if (!forceRefresh && accessToken && expiresAt > now + 300) {
    return accessToken;
  }

  const refreshed = await refreshGoogleAccessToken(
    clientId,
    clientSecret,
    refreshToken,
    pluginLabel,
  );

  await accountKeys.set_access_token?.(refreshed.access_token);
  await accountKeys.set_expires_at?.(String(now + refreshed.expires_in));

  return refreshed.access_token;
}
