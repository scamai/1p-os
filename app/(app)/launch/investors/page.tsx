import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InvestorBrowser } from "@/components/launch/InvestorBrowser";

export default async function InvestorsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: investors } = await supabase
    .from("investor_database")
    .select("*")
    .eq("is_active", true)
    .order("name")
    .limit(50);

  const { data: tracking } = await supabase
    .from("user_investor_tracking")
    .select("*")
    .eq("user_id", user.id);

  return <InvestorBrowser investors={investors ?? []} tracking={tracking ?? []} />;
}
