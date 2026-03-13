import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { agentMemory } from "@/lib/agents/memory";

const SearchSchema = z.object({
  agentId: z.string().min(1),
  query: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional(),
  category: z.enum(["fact", "preference", "relationship", "event", "insight"]).optional(),
});

const StoreSchema = z.object({
  agentId: z.string().min(1),
  content: z.string().min(1),
  category: z.enum(["fact", "preference", "relationship", "event", "insight"]),
  importance: z.number().min(0).max(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const DeleteSchema = z.object({
  id: z.string().min(1),
});

const HistorySchema = z.object({
  id: z.string().min(1),
});

// GET — search memories (semantic search via mem0 when available)
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agentId = req.nextUrl.searchParams.get("agentId");
  const query = req.nextUrl.searchParams.get("query");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "10", 10);
  const category = req.nextUrl.searchParams.get("category") as any;

  if (!agentId) {
    return NextResponse.json({ error: "agentId required" }, { status: 400 });
  }

  if (query) {
    const results = await agentMemory.searchAsync(agentId, query, limit);
    const filtered = category ? results.filter(r => r.category === category) : results;
    return NextResponse.json({
      memories: filtered,
      semantic: agentMemory.isSemanticEnabled,
    });
  }

  const results = await agentMemory.listAsync(agentId, category || undefined);
  return NextResponse.json({
    memories: results.slice(0, limit),
    semantic: agentMemory.isSemanticEnabled,
  });
}

// POST — store a memory
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = StoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Get business_id from user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("user_id", user.id)
    .single();

  const businessId = profile?.business_id ?? user.id;

  const entry = await agentMemory.addAsync(parsed.data.agentId, businessId, {
    content: parsed.data.content,
    category: parsed.data.category,
    importance: parsed.data.importance,
    metadata: parsed.data.metadata,
  });

  return NextResponse.json({ memory: entry }, { status: 201 });
}

// DELETE — remove a memory
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = DeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  agentMemory.remove(parsed.data.id);
  return NextResponse.json({ removed: true });
}

// PATCH — get memory history (mem0 only)
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = HistorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const history = await agentMemory.history(parsed.data.id);
  return NextResponse.json({ history });
}
