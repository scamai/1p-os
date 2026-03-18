import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HistoryPage } from "@/components/sections/history/HistoryPage";

export default async function HistoryPageRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && process.env.DEV_BYPASS !== "true") redirect("/auth/login");

  return <HistoryPage />;
}
