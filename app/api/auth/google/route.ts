import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    console.error("[api/auth/google] OAuth init error:", error);
    return NextResponse.json({ error: "Failed to initiate OAuth" }, { status: 500 });
  }

  return NextResponse.json({ url: data.url });
}
