// =============================================================================
// GET /api/integrations/callback
// OAuth callback — exchanges code for tokens and stores the integration
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";
import { exchangeCode, encryptCredentials, type StoredCredentials } from "@/lib/integrations/oauth";
import { getProvider } from "@/lib/integrations/providers";
import { appendLog } from "@/lib/integrations/md-logger";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${appUrl}/channels?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/channels?error=missing_params`);
  }

  // Decrypt and validate state
  let statePayload: { userId: string; provider: string; ts: number };
  try {
    statePayload = JSON.parse(decrypt(state));
  } catch {
    return NextResponse.redirect(`${appUrl}/channels?error=invalid_state`);
  }

  // Check state is not too old (10 minutes)
  if (Date.now() - statePayload.ts > 10 * 60 * 1000) {
    return NextResponse.redirect(`${appUrl}/channels?error=state_expired`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== statePayload.userId) {
    return NextResponse.redirect(`${appUrl}/channels?error=unauthorized`);
  }

  // Get business
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.redirect(`${appUrl}/channels?error=no_business`);
  }

  const provider = getProvider(statePayload.provider);
  if (!provider?.oauth) {
    return NextResponse.redirect(`${appUrl}/channels?error=invalid_provider`);
  }

  try {
    const redirectUri = `${appUrl}/api/integrations/callback`;
    const tokens = await exchangeCode(statePayload.provider, code, redirectUri);

    // Fetch user email for label (provider-specific)
    const email = await fetchAccountEmail(statePayload.provider, tokens.access_token);

    const credentials: StoredCredentials = {
      tokens,
      obtained_at: new Date().toISOString(),
      provider: statePayload.provider,
      email,
    };

    const encrypted = encryptCredentials(credentials);

    // Upsert integration record
    await supabase.from("integrations").upsert(
      {
        business_id: business.id,
        provider: statePayload.provider,
        label: email ?? provider.name,
        status: "active",
        credentials_encrypted: encrypted,
        scopes: provider.oauth.scopes,
        metadata: { email },
        last_synced_at: new Date().toISOString(),
        expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null,
      },
      { onConflict: "business_id,provider" }
    );

    await appendLog({
      action: "connect",
      provider: statePayload.provider,
      actor: user.id,
      details: `${provider.name} connected via OAuth — ${email ?? "no email"}`,
      metadata: { email, scopes: provider.oauth.scopes },
    });

    return NextResponse.redirect(
      `${appUrl}/channels?connected=${statePayload.provider}&email=${encodeURIComponent(email ?? "")}`
    );
  } catch (err) {
    console.error("OAuth callback error:", err);

    await appendLog({
      action: "connect_error",
      provider: statePayload.provider,
      actor: user.id,
      details: `OAuth callback failed: ${err instanceof Error ? err.message : "unknown"}`,
    });

    return NextResponse.redirect(`${appUrl}/channels?error=token_exchange_failed`);
  }
}

// Fetch the email address of the connected account
async function fetchAccountEmail(provider: string, accessToken: string): Promise<string | undefined> {
  try {
    if (provider === "gmail" || provider === "google_calendar" || provider === "google_drive") {
      const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { email?: string };
        return data.email;
      }
    }

    if (provider === "outlook") {
      const res = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { mail?: string; userPrincipalName?: string };
        return data.mail ?? data.userPrincipalName;
      }
    }

    if (provider === "slack") {
      const res = await fetch("https://slack.com/api/auth.test", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { user?: string; team?: string };
        return `${data.user}@${data.team}`;
      }
    }
  } catch {
    // Non-fatal — we just won't have a label
  }

  return undefined;
}
