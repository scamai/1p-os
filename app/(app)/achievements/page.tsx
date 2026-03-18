import { createClient } from "@/lib/supabase/server";
import { AchievementsView } from "./AchievementsView";

export default async function AchievementsPage() {
  const supabase = await createClient();
  const userId = "00000000-0000-0000-0000-000000000000";

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", userId)
    .single();

  const { data: achievements } = await supabase
    .from("achievements")
    .select("*")
    .eq("business_id", business?.id ?? "")
    .order("unlocked_at", { ascending: false });

  const items = (achievements ?? []).map(
    (a: {
      id: string;
      title: string;
      description: string;
      unlocked: boolean;
      unlocked_at: string | null;
      icon: string;
    }) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      unlocked: a.unlocked,
      unlockedAt: a.unlocked_at,
      icon: a.icon ?? "star",
    })
  );

  return <AchievementsView achievements={items} />;
}
