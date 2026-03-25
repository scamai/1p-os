import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STAGES = ["contacted", "qualified", "proposal_sent", "negotiation", "closed_won", "closed_lost"];

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    const [leadsRes, quotesRes] = await Promise.all([
      supabase
        .from("leads")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("quotes")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false }),
    ]);

    const leads = leadsRes.data ?? [];
    const quotes = quotesRes.data ?? [];

    // Group leads by stage
    const pipeline: Record<string, typeof leads> = {};
    for (const stage of STAGES) {
      pipeline[stage] = leads.filter((l) => l.stage === stage);
    }

    // Calculate totals
    const totalValue = leads
      .filter((l) => l.stage !== "closed_lost")
      .reduce((sum, l) => sum + (Number(l.value) || 0), 0);
    const wonValue = leads
      .filter((l) => l.stage === "closed_won")
      .reduce((sum, l) => sum + (Number(l.value) || 0), 0);

    return NextResponse.json({
      pipeline,
      quotes,
      summary: {
        totalLeads: leads.length,
        totalValue,
        wonValue,
        openDeals: leads.filter(
          (l) => !["closed_won", "closed_lost"].includes(l.stage)
        ).length,
      },
    });
  } catch (error) {
    console.error("[sales/pipeline] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
