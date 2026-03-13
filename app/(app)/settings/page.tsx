import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsView } from "./SettingsView";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  return (
    <SettingsView
      businessName={business?.name ?? ""}
      email={user.email ?? ""}
      timezone={business?.timezone ?? "America/New_York"}
    />
  );
}
