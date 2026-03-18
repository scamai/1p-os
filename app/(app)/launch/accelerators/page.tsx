import { createClient } from "@/lib/supabase/server";
import { AcceleratorBrowser } from "@/components/launch/AcceleratorBrowser";

export default async function AcceleratorsPage() {
  const supabase = await createClient();
  const userId = "00000000-0000-0000-0000-000000000000";

  const { data: programs } = await supabase
    .from("accelerator_programs")
    .select("*")
    .order("name");

  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("product_type, home_state, planning_to_raise")
    .eq("user_id", userId)
    .single();

  return <AcceleratorBrowser programs={programs ?? []} profile={profile} />;
}
