// =============================================================================
// GET  /api/integrations — list connected integrations
// DELETE /api/integrations — disconnect an integration
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { appendLog } from "@/lib/integrations/md-logger";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ integrations: [] });
  }

  const { data: integrations } = await supabase
    .from("integrations")
    .select("id, provider, label, status, scopes, metadata, last_synced_at, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ integrations: integrations ?? [] });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { integrationId } = await req.json();

  if (!integrationId) {
    return NextResponse.json({ error: "integrationId required" }, { status: 400 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "No business" }, { status: 404 });
  }

  // Fetch provider info before deleting for the log
  const { data: integration } = await supabase
    .from("integrations")
    .select("provider, label")
    .eq("id", integrationId)
    .eq("business_id", business.id)
    .single();

  await supabase
    .from("integrations")
    .delete()
    .eq("id", integrationId)
    .eq("business_id", business.id);

  await appendLog({
    action: "disconnect",
    provider: integration?.provider ?? "unknown",
    actor: user.id,
    details: `Disconnected ${integration?.provider ?? "unknown"} (${integration?.label ?? integrationId})`,
    metadata: { integrationId },
  });

  return NextResponse.json({ success: true });
}
