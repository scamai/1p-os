import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { AgentDetailView } from "./AgentDetailView";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: agent } = await supabase
    .from("marketplace_agents")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!agent) {
    notFound();
  }

  return (
    <AgentDetailView
      agent={{
        id: agent.id,
        name: agent.name,
        description: agent.description ?? "",
        longDescription: agent.long_description ?? agent.description ?? "",
        author: agent.author ?? "1P",
        rating: agent.rating ?? 5,
        installCount: agent.install_count ?? 0,
        estimatedDailyCost: agent.estimated_daily_cost ?? "$0.50/day",
        category: agent.category ?? "General",
        capabilities: agent.capabilities ?? [],
        permissions: agent.permissions ?? [],
      }}
    />
  );
}
