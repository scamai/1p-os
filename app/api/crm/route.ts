import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

    // Fetch relationships, leads, and recent invoices in parallel
    const [relationshipsRes, leadsRes, invoicesRes] = await Promise.all([
      supabase
        .from("relationships")
        .select("*")
        .eq("business_id", business.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("leads")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("invoices")
        .select("id, client_name, amount, status, created_at")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    return NextResponse.json({
      relationships: relationshipsRes.data ?? [],
      leads: leadsRes.data ?? [],
      recentInvoices: invoicesRes.data ?? [],
    });
  } catch (error) {
    console.error("[crm] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
