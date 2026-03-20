import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TemplateBrowser } from "@/components/launch/TemplateBrowser";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const userId = user.id;

  // Load founder profile for auto-fill
  let companyName = "";
  let founderName = "";
  let state = "";

  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("company_name, home_state")
    .eq("user_id", userId)
    .single();

  companyName = profile?.company_name || "";
  state = profile?.home_state || "";

  return (
    <TemplateBrowser
      initialData={{ companyName, founderName, state }}
    />
  );
}
