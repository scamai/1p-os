import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CompanyView } from "./CompanyView";

export default async function CompanyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, morning_brief")
    .eq("owner_id", user.id)
    .single();

  const businessId = business?.id ?? "";

  const { data: decisions } = await supabase
    .from("decisions")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  const cards = (decisions ?? []).map(
    (d: {
      id: string;
      type: string;
      title: string;
      description: string;
      urgency: string;
      options: { label: string; value: string }[] | null;
      status: string;
    }) => ({
      id: d.id,
      type: d.type as "approval" | "choice" | "fyi" | "alert",
      title: d.title,
      description: d.description,
      urgency: (d.urgency ?? "low") as "low" | "medium" | "high" | "critical",
      options: d.options ?? [],
      done: d.status === "resolved",
    })
  );

  return (
    <CompanyView
      cards={cards}
      morningBrief={business?.morning_brief ?? null}
    />
  );
}
