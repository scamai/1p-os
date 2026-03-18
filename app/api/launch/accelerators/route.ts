import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface MatchInput {
  product_type: string;
  home_state: string;
  planning_to_raise: boolean;
}

function scoreAccelerator(
  program: Record<string, unknown>,
  profile: MatchInput
): number {
  let score = 0;

  // Sector match: +40 points
  const sectors = (program.sectors as string[]) ?? [];
  if (sectors.includes(profile.product_type)) score += 40;

  // Stage match: +20 points (pre_seed always matches for new founders)
  if (program.stage === "pre_seed") score += 20;

  // Location match: +15 points
  const location = (program.location as string) ?? "";
  if (
    program.is_remote_friendly ||
    location.toLowerCase().includes(profile.home_state?.toLowerCase() ?? "")
  ) {
    score += 15;
  }

  // Deadline proximity: +15 points if deadline is 2+ weeks away
  const deadline = program.deadline as string | null;
  if (deadline) {
    const daysUntil = Math.ceil(
      (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil >= 14) score += 15;
    else if (daysUntil < 0) score -= 20; // Past deadline
  } else {
    score += 10; // Rolling deadline is always available
  }

  // General quality bonus for well-known programs
  const name = (program.name as string) ?? "";
  if (["Y Combinator", "Techstars", "500 Global"].includes(name)) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body: MatchInput = await request.json();

  const { data: programs, error } = await supabase
    .from("accelerator_programs")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const scored = (programs ?? [])
    .map((p: Record<string, unknown>) => ({
      ...p,
      match_score: scoreAccelerator(p, body),
    }))
    .sort((a: { match_score: number }, b: { match_score: number }) => b.match_score - a.match_score)
    .slice(0, 10);

  return NextResponse.json({ programs: scored });
}
