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

    const [invoicesRes, expensesRes, monthlyRes, transactionsRes] =
      await Promise.all([
        supabase
          .from("invoices")
          .select("*")
          .eq("business_id", business.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("expenses")
          .select("*")
          .eq("business_id", business.id)
          .order("date", { ascending: false }),
        supabase
          .from("monthly_finances")
          .select("*")
          .eq("business_id", business.id)
          .order("month", { ascending: false })
          .limit(12),
        supabase
          .from("transactions")
          .select("*")
          .eq("business_id", business.id)
          .order("date", { ascending: false })
          .limit(50),
      ]);

    const invoices = invoicesRes.data ?? [];
    const expenses = expensesRes.data ?? [];
    const monthly = monthlyRes.data ?? [];
    const transactions = transactionsRes.data ?? [];

    // Calculate summaries
    const totalRevenue = invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const totalExpenses = expenses.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0
    );
    const outstandingInvoices = invoices
      .filter((i) => ["sent", "overdue"].includes(i.status))
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

    // Monthly trend from monthly_finances
    const monthlyTrend = monthly.map((m) => ({
      month: m.month,
      revenue: Number(m.revenue) || 0,
      expenses: Number(m.expenses) || 0,
      net: (Number(m.revenue) || 0) - (Number(m.expenses) || 0),
    }));

    return NextResponse.json({
      invoices,
      expenses,
      transactions,
      monthlyTrend,
      summary: {
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        outstandingInvoices,
        invoiceCount: invoices.length,
        expenseCount: expenses.length,
      },
    });
  } catch (error) {
    console.error("[finance/summary] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
