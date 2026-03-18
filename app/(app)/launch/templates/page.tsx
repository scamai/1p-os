import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TemplateBrowser } from "@/components/launch/TemplateBrowser";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && process.env.DEV_BYPASS !== "true") redirect("/auth/login");

  // Load founder profile for auto-fill
  let companyName = "";
  let founderName = "";
  let state = "";

  if (user) {
    const { data: profile } = await supabase
      .from("founder_profiles")
      .select("company_name, home_state")
      .eq("user_id", user.id)
      .single();

    companyName = profile?.company_name || "";
    state = profile?.home_state || "";
    founderName =
      user.user_metadata?.full_name || user.user_metadata?.name || "";
  }

  return (
    <TemplateBrowser
      initialData={{ companyName, founderName, state }}
    />
  );
}
