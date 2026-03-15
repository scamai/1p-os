import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createGoal, getGoalTree, getGoalsByLevel } from "@/lib/orchestration/goals";

export const dynamic = "force-dynamic";

const CreateGoalSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  level: z.enum(["mission", "strategic", "tactical", "task"]),
  parentGoalId: z.string().uuid().optional(),
  assignedAgentId: z.string().uuid().optional(),
  priority: z.number().int().min(1).max(10).optional(),
  dueDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses").select("id").eq("user_id", user.id).single();
  if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

  const level = request.nextUrl.searchParams.get("level");
  const format = request.nextUrl.searchParams.get("format");

  if (format === "tree") {
    const tree = await getGoalTree(business.id, supabase);
    return NextResponse.json({ goals: tree });
  }

  if (level) {
    const goals = await getGoalsByLevel(business.id, level as any, supabase);
    return NextResponse.json({ goals });
  }

  const tree = await getGoalTree(business.id, supabase);
  return NextResponse.json({ goals: tree });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses").select("id").eq("user_id", user.id).single();
  if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

  const body = await request.json();
  const parsed = CreateGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await createGoal(business.id, parsed.data, supabase);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({ goal: result.data }, { status: 201 });
}
