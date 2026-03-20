import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDesc = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/launch";

  // Use x-forwarded-host if available (reverse proxy), else fall back to APP_URL
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : (process.env.NEXT_PUBLIC_APP_URL ?? "https://1press.com");

  // GoTrue error redirect (e.g. bad_oauth_state) — forward to login with details
  if (error) {
    const params = new URLSearchParams({ error: "auth_failed", error_code: errorCode || error, error_description: errorDesc || "" });
    return NextResponse.redirect(`${origin}/auth/login?${params}`);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (!exchangeError) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error("[auth/callback] exchangeCodeForSession error:", exchangeError);
    } catch (e) {
      console.error("[auth/callback] exception:", e);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
