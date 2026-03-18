import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TemplateBrowser } from "@/components/launch/TemplateBrowser";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: templates } = await supabase
    .from("launch_templates")
    .select("*")
    .order("category, title");

  return <TemplateBrowser templates={templates ?? []} />;
}
