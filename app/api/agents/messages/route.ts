import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const QuerySchema = z.object({
  chainId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
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

    const { chainId, agentId, limit, offset } = parsed.data;

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
      .from('agent_messages')
      .select('*', { count: 'exact' })
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (chainId) {
      query = query.eq('chain_id', chainId);
    }

    if (agentId) {
      query = query.or(`from_agent_id.eq.${agentId},to_agent_id.eq.${agentId}`);
    }

    const { data: messages, error, count } = await query;

    if (error) {
      console.error('[agents/messages] Failed to fetch messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { messages, total: count ?? 0, limit, offset },
      { status: 200 }
    );
  } catch (error) {
    console.error('[agents/messages] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
