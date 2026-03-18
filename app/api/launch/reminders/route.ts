import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("launch_reminders")
    .select("*")
    .eq("user_id", user.id)
    .order("due_date");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reminders: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, description, due_date, reminder_type, severity } = body;

  if (!title || !due_date) {
    return NextResponse.json({ error: "title and due_date required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("launch_reminders")
    .insert({
      user_id: user.id,
      title,
      description: description ?? null,
      due_date,
      reminder_type: reminder_type ?? "custom",
      severity: severity ?? "info",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, is_completed } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("launch_reminders")
    .update({
      is_completed: is_completed ?? true,
      completed_at: is_completed ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
