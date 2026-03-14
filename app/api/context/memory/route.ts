import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const SearchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const AddMemorySchema = z.object({
  content: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  source: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = SearchQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { q, limit } = parsed.data;

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

    // Text search on memory entries
    const { data: memories, error } = await supabase
      .from('business_memory')
      .select('*')
      .eq('business_id', business.id)
      .ilike('content', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[context/memory] Failed to search memory:', error);
      return NextResponse.json(
        { error: 'Failed to search memory' },
        { status: 500 }
      );
    }

    return NextResponse.json({ memories, query: q }, { status: 200 });
  } catch (error) {
    console.error('[context/memory] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = AddMemorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

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

    const { data: memory, error } = await supabase
      .from('business_memory')
      .insert({
        business_id: business.id,
        content: parsed.data.content,
        category: parsed.data.category,
        tags: parsed.data.tags,
        source: parsed.data.source ?? 'manual',
      })
      .select()
      .single();

    if (error) {
      console.error('[context/memory] Failed to add memory:', error);
      return NextResponse.json(
        { error: 'Failed to add memory' },
        { status: 500 }
      );
    }

    return NextResponse.json({ memory }, { status: 201 });
  } catch (error) {
    console.error('[context/memory] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
