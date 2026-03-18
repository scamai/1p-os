import { createClient } from "@/lib/supabase/server";
import { TemplateBrowser } from "@/components/launch/TemplateBrowser";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const userId = "00000000-0000-0000-0000-000000000000";

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
