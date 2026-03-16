import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateMorningBrief } from "@/lib/orchestration/morning-brief";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!business)
    return NextResponse.json({ error: "No business" }, { status: 404 });

  const brief = await generateMorningBrief(business.id, supabase);
  return NextResponse.json(brief);
}
