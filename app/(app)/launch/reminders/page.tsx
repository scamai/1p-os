import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RemindersView } from "@/components/launch/RemindersView";

export default async function RemindersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: reminders } = await supabase
    .from("launch_reminders")
    .select("*")
    .eq("user_id", user.id)
    .order("due_date");

  return <RemindersView reminders={reminders ?? []} />;
}
