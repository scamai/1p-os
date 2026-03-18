import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/supabase/dev-user";
import { RemindersView } from "@/components/launch/RemindersView";

export default async function RemindersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && process.env.DEV_BYPASS !== "true") redirect("/auth/login");
  const userId = getUserId(user);

  const { data: reminders } = await supabase
    .from("launch_reminders")
    .select("*")
    .eq("user_id", userId)
    .order("due_date");

  return <RemindersView reminders={reminders ?? []} />;
}
