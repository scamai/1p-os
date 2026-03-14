import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  status: z.enum(['pending', 'completed', 'all']).default('pending'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
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

    const { status, limit, offset } = parsed.data;

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

    let query = supabase
      .from('decision_cards')
      .select('*', { count: 'exact' })
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: decisions, error, count } = await query;

    if (error) {
      console.error('[decisions] Failed to fetch decisions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch decisions' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { decisions, total: count ?? 0, limit, offset },
      { status: 200 }
    );
  } catch (error) {
    console.error('[decisions] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
