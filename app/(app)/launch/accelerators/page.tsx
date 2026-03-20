import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AcceleratorBrowser } from "@/components/launch/AcceleratorBrowser";

export default async function AcceleratorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const userId = user.id;

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
