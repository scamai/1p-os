// =============================================================================
// 1P OS — OAuth2 Flow Helper
// Handles authorization URL generation, token exchange, and refresh
// =============================================================================

import { encrypt, decrypt } from "@/lib/encryption";
import { getProvider, type ProviderConfig } from "./providers";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

export interface StoredCredentials {
  tokens: OAuthTokens;
  obtained_at: string;    // ISO timestamp
  provider: string;
  email?: string;         // The account email (for display)
}

// -----------------------------------------------------------------------------
// Authorization URL
// -----------------------------------------------------------------------------

export function buildAuthUrl(
  providerId: string,
  state: string,
  redirectUri: string
): string {
  const provider = getProvider(providerId);
  if (!provider?.oauth) {
    throw new Error(`Provider "${providerId}" does not support OAuth`);
  }

  const { authUrl, scopes } = provider.oauth;
  const clientId = getClientId(providerId);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    state,
    access_type: "offline",
    prompt: "consent",
  });

  return `${authUrl}?${params.toString()}`;
}

// -----------------------------------------------------------------------------
// Token Exchange
// -----------------------------------------------------------------------------

export async function exchangeCode(
  providerId: string,
  code: string,
  redirectUri: string
): Promise<OAuthTokens> {
  const provider = getProvider(providerId);
  if (!provider?.oauth) {
    throw new Error(`Provider "${providerId}" does not support OAuth`);
  }

  const clientId = getClientId(providerId);
  const clientSecret = getClientSecret(providerId);

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(provider.oauth.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed for ${providerId}: ${err}`);
  }

  return res.json() as Promise<OAuthTokens>;
}

// -----------------------------------------------------------------------------
// Token Refresh
// -----------------------------------------------------------------------------

export async function refreshTokens(
  providerId: string,
  refreshToken: string
): Promise<OAuthTokens> {
  const provider = getProvider(providerId);
  if (!provider?.oauth) {
    throw new Error(`Provider "${providerId}" does not support OAuth`);
  }

  const clientId = getClientId(providerId);
  const clientSecret = getClientSecret(providerId);

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch(provider.oauth.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed for ${providerId}: ${err}`);
  }

  const tokens = (await res.json()) as OAuthTokens;
  // Some providers don't return refresh_token on refresh — preserve the old one
  if (!tokens.refresh_token) {
    tokens.refresh_token = refreshToken;
  }
  return tokens;
}

// -----------------------------------------------------------------------------
// Credential Encryption
// -----------------------------------------------------------------------------

export function encryptCredentials(creds: StoredCredentials): string {
  return encrypt(JSON.stringify(creds));
}

export function decryptCredentials(encrypted: string): StoredCredentials {
  return JSON.parse(decrypt(encrypted)) as StoredCredentials;
}

// -----------------------------------------------------------------------------
// Get valid access token (refresh if expired)
// -----------------------------------------------------------------------------

export async function getValidAccessToken(
  encrypted: string
): Promise<{ accessToken: string; updated?: string }> {
  const creds = decryptCredentials(encrypted);

  // Check if token is still valid (with 5-min buffer)
  const obtainedAt = new Date(creds.obtained_at).getTime();
  const expiresIn = (creds.tokens.expires_in ?? 3600) * 1000;
  const buffer = 5 * 60 * 1000;
  const isExpired = Date.now() > obtainedAt + expiresIn - buffer;

  if (!isExpired) {
    return { accessToken: creds.tokens.access_token };
  }

  // Needs refresh
  if (!creds.tokens.refresh_token) {
    throw new Error("Token expired and no refresh token available");
  }

  const newTokens = await refreshTokens(creds.provider, creds.tokens.refresh_token);
  const updatedCreds: StoredCredentials = {
    ...creds,
    tokens: newTokens,
    obtained_at: new Date().toISOString(),
  };

  return {
    accessToken: newTokens.access_token,
    updated: encryptCredentials(updatedCreds),
  };
}

// -----------------------------------------------------------------------------
// Env helpers
// -----------------------------------------------------------------------------

function getClientId(providerId: string): string {
  const map: Record<string, string> = {
    gmail: "GOOGLE_CLIENT_ID",
    google_calendar: "GOOGLE_CLIENT_ID",
    google_drive: "GOOGLE_CLIENT_ID",
    outlook: "MICROSOFT_CLIENT_ID",
    slack: "SLACK_CLIENT_ID",
    notion: "NOTION_CLIENT_ID",
  };
  const envVar = map[providerId];
  if (!envVar) throw new Error(`No client ID env var configured for ${providerId}`);
  const value = process.env[envVar];
  if (!value) throw new Error(`${envVar} is not set`);
  return value;
}

function getClientSecret(providerId: string): string {
  const map: Record<string, string> = {
    gmail: "GOOGLE_CLIENT_SECRET",
    google_calendar: "GOOGLE_CLIENT_SECRET",
    google_drive: "GOOGLE_CLIENT_SECRET",
    outlook: "MICROSOFT_CLIENT_SECRET",
    slack: "SLACK_CLIENT_SECRET",
    notion: "NOTION_CLIENT_SECRET",
  };
  const envVar = map[providerId];
  if (!envVar) throw new Error(`No client secret env var configured for ${providerId}`);
  const value = process.env[envVar];
  if (!value) throw new Error(`${envVar} is not set`);
  return value;
}
