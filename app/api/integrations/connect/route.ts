// =============================================================================
// POST /api/integrations/connect
// Starts OAuth flow — returns the authorization URL to redirect the user to
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthUrl } from "@/lib/integrations/oauth";
import { getProvider } from "@/lib/integrations/providers";
import { encrypt } from "@/lib/encryption";
import { appendLog } from "@/lib/integrations/md-logger";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider: providerId, credentials } = await req.json();

  const provider = getProvider(providerId);
  if (!provider) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  // API-key-based providers — store credentials directly
  if (provider.authType === "api_key") {
    if (credentials && typeof credentials === "object") {
      // Get business
      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (business) {
        const encrypted = encrypt(JSON.stringify(credentials));
        await supabase.from("integrations").upsert(
          {
            business_id: business.id,
            provider: providerId,
            label: provider.name,
            status: "active",
            credentials_encrypted: encrypted,
            metadata: {},
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: "business_id,provider" }
        );
      }
    }

    await appendLog({
      action: "connect",
      provider: providerId,
      actor: user.id,
      details: credentials ? `${provider.name} connected via API key` : `${provider.name} configure requested (no credentials provided)`,
      metadata: { authType: "api_key", hasCredentials: !!credentials },
    });

    return NextResponse.json({
      authType: "api_key",
      provider: providerId,
      connected: !!credentials,
      message: credentials ? `${provider.name} connected` : `Credentials required`,
    });
  }

  // OAuth providers — check if credentials are configured
  try {
    const statePayload = JSON.stringify({
      userId: user.id,
      provider: providerId,
      ts: Date.now(),
    });
    const state = encrypt(statePayload);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const redirectUri = `${appUrl}/api/integrations/callback`;

    const url = buildAuthUrl(providerId, state, redirectUri);

    await appendLog({
      action: "connect_oauth_start",
      provider: providerId,
      actor: user.id,
      details: `OAuth flow initiated for ${provider.name}`,
    });

    return NextResponse.json({ url, authType: "oauth2" });
  } catch (err) {
    console.error('[integrations/connect] OAuth error:', err);
    return NextResponse.json(
      { error: "oauth_error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
