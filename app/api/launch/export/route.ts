import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** GDPR-compliant data export — returns all user data as JSON */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    { data: profile },
    { data: progress },
    { data: reminders },
    { data: tracking },
  ] = await Promise.all([
    supabase
      .from("founder_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("user_launch_progress")
      .select("*, launch_steps(title, slug)")
      .eq("user_id", user.id),
    supabase
      .from("launch_reminders")
      .select("*")
      .eq("user_id", user.id),
    supabase
      .from("user_investor_tracking")
      .select("*, investor_database(name, firm)")
      .eq("user_id", user.id),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
    },
    founder_profile: profile,
    launch_progress: progress ?? [],
    reminders: reminders ?? [],
    investor_tracking: tracking ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="founderlaunch-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
