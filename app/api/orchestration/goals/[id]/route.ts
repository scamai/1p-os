import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateGoalStatus } from "@/lib/orchestration/goals";
import { decomposeGoal } from "@/lib/orchestration/ceo";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: goal } = await supabase
    .from("goals").select("*").eq("id", params.id).single();
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Load children
  const { data: children } = await supabase
    .from("goals").select("*").eq("parent_goal_id", params.id).order("priority", { ascending: false });

  return NextResponse.json({ goal, children: children ?? [] });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (body.status) {
    const result = await updateGoalStatus(params.id, body.status, supabase);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 422 });
  }

  if (body.action === "decompose") {
    const { data: business } = await supabase
      .from("businesses").select("id").eq("user_id", user.id).single();
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const result = await decomposeGoal(business.id, params.id, supabase);
    return NextResponse.json(result);
  }

  // Generic field updates
  const allowed = ["title", "description", "assigned_agent_id", "priority", "due_date"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const { error } = await supabase.from("goals").update(updates).eq("id", params.id);
  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

  return NextResponse.json({ success: true });
}
