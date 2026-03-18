import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/supabase/dev-user";
import { AcceleratorBrowser } from "@/components/launch/AcceleratorBrowser";

export default async function AcceleratorsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && process.env.DEV_BYPASS !== "true") redirect("/auth/login");
  const userId = getUserId(user);

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
