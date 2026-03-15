import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HQPage } from "@/components/sections/hq/HQPage";

export default async function CompanyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return <HQPage />;
}
