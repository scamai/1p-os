import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Allowlisted tables — prevents arbitrary table access */
const ALLOWED_TABLES: Record<string, string> = {
  founders: "founders",
  shareholders: "shareholders",
  incorporation_steps: "incorporation_steps",
  competitors: "competitors",
  deck_slides: "deck_slides",
  ideation_items: "ideation_items",
  accelerator_apps: "accelerator_apps",
  fundraising_rounds: "fundraising_rounds",
  investors: "investors",
  monthly_finances: "monthly_finances",
  transactions: "transactions",
  tax_deductions: "tax_deductions",
  tax_filings: "tax_filings",
  pricing_tiers: "pricing_tiers",
  gtm_tasks: "gtm_tasks",
  marketing_channels: "marketing_channels",
  content_items: "content_items",
  campaigns: "campaigns",
  contracts: "contracts",
  safes: "safes",
  compliance_items: "compliance_items",
  ip_assets: "ip_assets",
  leads: "leads",
  quotes: "quotes",
  payments: "payments",
  products: "products",
  // Singleton tables (one row per business)
  market_data: "market_data",
  business_canvas: "business_canvas",
  accounting_data: "accounting_data",
};

const SINGLETON_TABLES = new Set([
  "market_data",
  "business_canvas",
  "accounting_data",
]);

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (bizError || !business) {
    return {
      error: NextResponse.json(
        { error: "No business found. Complete setup first." },
        { status: 404 }
      ),
    };
  }

  return { supabase, business };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  const tableName = ALLOWED_TABLES[params.table];
  if (!tableName) {
    return NextResponse.json({ error: "Unknown table" }, { status: 400 });
  }

  const ctx = await getAuthContext();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { supabase, business } = ctx as { supabase: Awaited<ReturnType<typeof createClient>>; business: { id: string } };

  const id = request.nextUrl.searchParams.get("id");

  if (id) {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("business_id", business.id)
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ data });
  }

  if (SINGLETON_TABLES.has(tableName)) {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("business_id", business.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data: data ?? null });
  }

  const orderBy = request.nextUrl.searchParams.get("order") || "created_at";
  const ascending = request.nextUrl.searchParams.get("asc") === "true";

  let query = supabase
    .from(tableName)
    .select("*")
    .eq("business_id", business.id)
    .order(orderBy, { ascending });

  // Support filtering by any column via query params
  const filterParams = new Set(["id", "order", "asc"]);
  request.nextUrl.searchParams.forEach((value, key) => {
    if (!filterParams.has(key)) {
      query = query.eq(key, value);
    }
  });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  const tableName = ALLOWED_TABLES[params.table];
  if (!tableName) {
    return NextResponse.json({ error: "Unknown table" }, { status: 400 });
  }

  const ctx = await getAuthContext();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { supabase, business } = ctx as { supabase: Awaited<ReturnType<typeof createClient>>; business: { id: string } };

  const body = await request.json();
  // Strip client-side fields that shouldn't be sent
  const { id: _id, created_at: _ca, updated_at: _ua, business_id: _bid, ...payload } = body;

  if (SINGLETON_TABLES.has(tableName)) {
    const { data, error } = await supabase
      .from(tableName)
      .upsert(
        { ...payload, business_id: business.id, updated_at: new Date().toISOString() },
        { onConflict: "business_id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data }, { status: 200 });
  }

  const { data, error } = await supabase
    .from(tableName)
    .insert({ ...payload, business_id: business.id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  const tableName = ALLOWED_TABLES[params.table];
  if (!tableName) {
    return NextResponse.json({ error: "Unknown table" }, { status: 400 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const ctx = await getAuthContext();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { supabase, business } = ctx as { supabase: Awaited<ReturnType<typeof createClient>>; business: { id: string } };

  const body = await request.json();
  const { id: _id, created_at: _ca, business_id: _bid, ...payload } = body;

  const { data, error } = await supabase
    .from(tableName)
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("business_id", business.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  const tableName = ALLOWED_TABLES[params.table];
  if (!tableName) {
    return NextResponse.json({ error: "Unknown table" }, { status: 400 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const ctx = await getAuthContext();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { supabase, business } = ctx as { supabase: Awaited<ReturnType<typeof createClient>>; business: { id: string } };

  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ deleted: id });
}
