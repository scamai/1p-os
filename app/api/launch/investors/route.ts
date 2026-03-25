import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = new URL(request.url);

  const stage = url.searchParams.get("stage");
  const sector = url.searchParams.get("sector");
  const checkMin = url.searchParams.get("check_min");
  const checkMax = url.searchParams.get("check_max");
  const location = url.searchParams.get("location");
  const search = url.searchParams.get("q");
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 50);

  let query = supabase
    .from("investor_database")
    .select("*")
    .eq("is_active", true)
    .order("id")
    .limit(limit);

  if (cursor) query = query.gt("id", parseInt(cursor));
  if (stage) query = query.contains("stage", [stage]);
  if (sector) query = query.contains("sectors", [sector]);
  if (checkMin) query = query.gte("check_size_max", parseInt(checkMin));
  if (checkMax) query = query.lte("check_size_min", parseInt(checkMax));
  if (location) query = query.ilike("location", `%${location.replace(/[%_]/g, '')}%`);
  if (search) {
    const s = search.replace(/[%_.,()]/g, '');
    query = query.or(`name.ilike.%${s}%,firm.ilike.%${s}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const nextCursor = data && data.length === limit ? data[data.length - 1].id : null;

  return NextResponse.json({
    investors: data ?? [],
    next_cursor: nextCursor,
    count: data?.length ?? 0,
  });
}
