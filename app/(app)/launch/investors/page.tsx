import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/supabase/dev-user";
import { InvestorBrowser } from "@/components/launch/InvestorBrowser";

export default async function InvestorsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && process.env.DEV_BYPASS !== "true") redirect("/auth/login");
  const userId = getUserId(user);

  const { data: investors } = await supabase
    .from("investor_database")
    .select("*")
    .eq("is_active", true)
    .order("name")
    .limit(50);

  const { data: tracking } = await supabase
    .from("user_investor_tracking")
    .select("*")
    .eq("user_id", userId);

  return <InvestorBrowser investors={investors ?? []} tracking={tracking ?? []} />;
}
