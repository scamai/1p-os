import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: phases }, { data: steps }, { data: progress }, { data: profile }] =
    await Promise.all([
      supabase.from("launch_phases").select("*").order("sort_order"),
      supabase.from("launch_steps").select("*").order("sort_order"),
      supabase.from("user_launch_progress").select("*").eq("user_id", user.id),
      supabase.from("founder_profiles").select("*").eq("user_id", user.id).single(),
    ]);

  const completedCount = (progress ?? []).filter(
    (p: { status: string }) => p.status === "completed" || p.status === "skipped"
  ).length;
  const totalSteps = (steps ?? []).length;

  return NextResponse.json({
    phases: phases ?? [],
    steps: steps ?? [],
    progress: progress ?? [],
    profile,
    stats: {
      completed: completedCount,
      total: totalSteps,
      percentage: totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0,
    },
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { step_id, status, metadata, notes } = body;

  if (!step_id || !status) {
    return NextResponse.json({ error: "step_id and status required" }, { status: 400 });
  }

  // Upsert progress
  const { data, error } = await supabase
    .from("user_launch_progress")
    .upsert(
      {
        user_id: user.id,
        step_id,
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
        metadata: metadata ?? null,
        notes: notes ?? null,
      },
      { onConflict: "user_id,step_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  // Auto-create reminders for specific steps
  if (status === "completed") {
    const { data: step } = await supabase
      .from("launch_steps")
      .select("slug")
      .eq("id", step_id)
      .single();

    if (step?.slug === "stock-purchase") {
      // 83(b) election deadline — 30 days from stock purchase
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      await supabase.from("launch_reminders").insert({
        user_id: user.id,
        title: "83(b) election deadline",
        description:
          "You MUST mail your 83(b) election to the IRS before this date. There is no extension.",
        due_date: dueDate.toISOString().split("T")[0],
        reminder_type: "deadline",
        severity: "critical",
        related_step_id: step_id,
      });
    }

    if (step?.slug === "file-incorporation") {
      // Delaware franchise tax — recurring March 1
      await supabase.from("launch_reminders").insert({
        user_id: user.id,
        title: "Delaware franchise tax",
        description: "Annual Delaware franchise tax due. Late fees apply.",
        due_date: `${new Date().getFullYear() + 1}-03-01`,
        reminder_type: "tax",
        severity: "critical",
        is_recurring: true,
        recurrence_rule: "FREQ=YEARLY;BYMONTH=3;BYMONTHDAY=1",
      });

      // Delaware annual report — recurring March 1
      await supabase.from("launch_reminders").insert({
        user_id: user.id,
        title: "Delaware annual report",
        description: "Annual report filing due with the Delaware Division of Corporations.",
        due_date: `${new Date().getFullYear() + 1}-03-01`,
        reminder_type: "filing",
        severity: "warning",
        is_recurring: true,
        recurrence_rule: "FREQ=YEARLY;BYMONTH=3;BYMONTHDAY=1",
      });
    }
  }

  return NextResponse.json({ data });
}
