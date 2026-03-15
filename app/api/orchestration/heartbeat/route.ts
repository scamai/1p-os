import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { triggerHeartbeat, triggerAllHeartbeats, getRecentHeartbeats } from "@/lib/orchestration/heartbeat";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses").select("id").eq("user_id", user.id).single();
  if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const agentId = body.agentId;

  if (agentId) {
    const result = await triggerHeartbeat(business.id, agentId, "manual", supabase);
    return NextResponse.json(result);
  }

  const results = await triggerAllHeartbeats(business.id, supabase);
  return NextResponse.json({ results });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses").select("id").eq("user_id", user.id).single();
  if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

  const agentId = request.nextUrl.searchParams.get("agentId") ?? undefined;
  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10);

  const runs = await getRecentHeartbeats(business.id, agentId, limit, supabase);
  return NextResponse.json({ runs });
}
