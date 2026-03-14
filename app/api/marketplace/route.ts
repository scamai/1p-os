import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['popular', 'newest', 'name']).default('popular'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = QuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { category, search, sort, limit, offset } = parsed.data;

    let query = supabase
      .from('marketplace_agents')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    switch (sort) {
      case 'popular':
        query = query.order('install_count', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'name':
        query = query.order('name', { ascending: true });
        break;
    }

    const { data: agents, error, count } = await query;

    if (error) {
      console.error('[marketplace] Failed to fetch agents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch marketplace agents' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { agents, total: count ?? 0, limit, offset },
      { status: 200 }
    );
  } catch (error) {
    console.error('[marketplace] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
