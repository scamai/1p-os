import { createClient } from "@/lib/supabase/server";
import { TalentView } from "./TalentView";

export default async function TalentPage() {
  const supabase = await createClient();

  const { data: listings } = await supabase
    .from("marketplace_agents")
    .select("*")
    .eq("published", true)
    .order("install_count", { ascending: false });

  const items = (listings ?? []).map(
    (l: {
      id: string;
      name: string;
      description: string;
      author: string;
      rating: number;
      install_count: number;
      estimated_daily_cost: string;
      category: string;
    }) => ({
      id: l.id,
      name: l.name,
      description: l.description,
      author: l.author ?? "1P",
      rating: l.rating ?? 5,
      installCount: l.install_count ?? 0,
      estimatedDailyCost: l.estimated_daily_cost ?? "$0.50/day",
      category: l.category ?? "General",
    })
  );

  return <TalentView listings={items} />;
}
