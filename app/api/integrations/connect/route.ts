// =============================================================================
// POST /api/integrations/connect
// Starts OAuth flow — returns the authorization URL to redirect the user to
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthUrl } from "@/lib/integrations/oauth";
import { getProvider } from "@/lib/integrations/providers";
import { encrypt } from "@/lib/encryption";

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

    return NextResponse.json({
      authType: "api_key",
      provider: providerId,
      message: `${provider.name} connected`,
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

    return NextResponse.json({ url, authType: "oauth2" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    // If the error is about missing env vars, return a helpful message
    if (message.includes("is not set")) {
      const envVar = message.split(" ")[0]; // e.g. "GOOGLE_CLIENT_ID"
      return NextResponse.json(
        {
          error: "not_configured",
          provider: providerId,
          message: `${provider.name} OAuth is not configured yet. Set ${envVar} in your .env.local file.`,
          envVar,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: "oauth_error", message },
      { status: 500 }
    );
  }
}
