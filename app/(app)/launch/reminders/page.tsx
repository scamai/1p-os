import { createClient } from "@/lib/supabase/server";
import { RemindersView } from "@/components/launch/RemindersView";

export default async function RemindersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const { data: reminders } = await supabase
    .from("launch_reminders")
    .select("*")
    .eq("user_id", userId)
    .order("due_date");

  return <RemindersView reminders={reminders ?? []} />;
}
