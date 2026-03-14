import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  actor: z.string().optional(),
  action: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
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

    const { from, to, actor, action, page, limit } = parsed.data;

    // Get user's business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: 'No business found' },
        { status: 404 }
      );
    }

    const offset = (page - 1) * limit;

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (from) {
      query = query.gte('created_at', from);
    }

    if (to) {
      query = query.lte('created_at', to);
    }

    if (actor) {
      query = query.eq('actor', actor);
    }

    if (action) {
      query = query.eq('action', action);
    }

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('[safety/audit] Failed to fetch audit log:', error);
      return NextResponse.json(
        { error: 'Failed to fetch audit log' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        logs,
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[safety/audit] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
