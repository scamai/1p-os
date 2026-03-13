import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/memory/stats — Aggregated memory statistics for visualization.
 *
 * Returns:
 * - totalMemories: count of all memories
 * - byAgent: { agentId, agentName, count }[]
 * - byCategory: { category, count }[]
 * - recentMemories: last 50 memories with full content
 * - timeline: { date, count }[] for last 30 days
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's business
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("user_id", user.id)
    .single();

  const businessId = profile?.business_id;
  if (!businessId) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  // Fetch mem0 memories from Supabase (filter by businessId in metadata)
  const { data: allMemories, count: totalCount } = await supabase
    .from("mem0_memories")
    .select("id, metadata, created_at, updated_at", { count: "exact" })
    .contains("metadata", { businessId })
    .order("created_at", { ascending: false })
    .limit(500);

  const memories = allMemories ?? [];

  // Aggregate by agent
  const agentCounts = new Map<string, { name: string; count: number }>();
  for (const m of memories) {
    const agentId = m.metadata?.agentId ?? "unknown";
    const agentName = m.metadata?.agentName ?? agentId;
    const existing = agentCounts.get(agentId);
    if (existing) {
      existing.count++;
    } else {
      agentCounts.set(agentId, { name: agentName, count: 1 });
    }
  }

  // Aggregate by category
  const categoryCounts = new Map<string, number>();
  for (const m of memories) {
    const category = m.metadata?.category ?? "uncategorized";
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }

  // Timeline — last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const timelineCounts = new Map<string, number>();
  for (const m of memories) {
    const date = m.created_at?.split("T")[0];
    if (date && new Date(date) >= thirtyDaysAgo) {
      timelineCounts.set(date, (timelineCounts.get(date) ?? 0) + 1);
    }
  }

  // Fill in missing days
  const timeline: { date: string; count: number }[] = [];
  for (let d = new Date(thirtyDaysAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    timeline.push({ date: dateStr, count: timelineCounts.get(dateStr) ?? 0 });
  }

  // Recent memories with full content (top 50)
  const { data: recentRaw } = await supabase
    .from("mem0_memories")
    .select("id, metadata, created_at, updated_at")
    .contains("metadata", { businessId })
    .order("created_at", { ascending: false })
    .limit(50);

  const recentMemories = (recentRaw ?? []).map((m) => ({
    id: m.id,
    content: m.metadata?.data ?? m.metadata?.memory ?? "",
    category: m.metadata?.category ?? "uncategorized",
    agentId: m.metadata?.agentId ?? "unknown",
    importance: m.metadata?.importance ?? 0.5,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  }));

  // Also pull from business_memory table for legacy memories
  const { data: legacyMemories, count: legacyCount } = await supabase
    .from("business_memory")
    .select("id, content, category, source_agent_id, created_at", { count: "exact" })
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(50);

  // Merge legacy into recent
  for (const lm of legacyMemories ?? []) {
    recentMemories.push({
      id: lm.id,
      content: lm.content,
      category: lm.category ?? "uncategorized",
      agentId: lm.source_agent_id ?? "system",
      importance: 0.5,
      createdAt: lm.created_at,
      updatedAt: lm.created_at,
    });
  }

  // Sort combined by date
  recentMemories.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Load agent names for display
  const agentIds = [...new Set(recentMemories.map((m) => m.agentId).filter((id) => id !== "unknown" && id !== "system" && id !== "core-chat"))];
  const { data: agentRows } = agentIds.length > 0
    ? await supabase.from("agents").select("id, name").in("id", agentIds)
    : { data: [] };

  const agentNameMap = new Map<string, string>();
  for (const a of agentRows ?? []) {
    agentNameMap.set(a.id, a.name);
  }

  return NextResponse.json({
    totalMemories: (totalCount ?? 0) + (legacyCount ?? 0),
    byAgent: [...agentCounts.entries()].map(([id, { name, count }]) => ({
      agentId: id,
      agentName: agentNameMap.get(id) ?? name,
      count,
    })),
    byCategory: [...categoryCounts.entries()].map(([category, count]) => ({
      category,
      count,
    })),
    timeline,
    recentMemories: recentMemories.slice(0, 50).map((m) => ({
      ...m,
      agentName: agentNameMap.get(m.agentId) ?? m.agentId,
    })),
    semantic: true,
  });
}
