import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HistoryView } from "./HistoryView";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("business_id", business?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(100);

  const entries = (logs ?? []).map(
    (l: {
      id: string;
      action: string;
      agent_name: string;
      details: string;
      created_at: string;
      category: string;
    }) => ({
      id: l.id,
      action: l.action,
      agentName: l.agent_name ?? "System",
      details: l.details ?? "",
      createdAt: l.created_at,
      category: l.category ?? "general",
    })
  );

  return <HistoryView entries={entries} />;
}
