import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HistoryPage } from "@/components/sections/history/HistoryPage";

export default async function HistoryPageRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return <HistoryPage />;
}
