import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const GetContextQuerySchema = z.object({
  scope: z.string().min(1),
});

const UpdateContextSchema = z.object({
  scope: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = GetContextQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { scope } = parsed.data;

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

    const { data: context, error } = await supabase
      .from('business_memory')
      .select('*')
      .eq('business_id', business.id)
      .eq('scope', scope)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[context] Failed to fetch context:', error);
      return NextResponse.json(
        { error: 'Failed to fetch context' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { context: context ?? { scope, data: {} } },
      { status: 200 }
    );
  } catch (error) {
    console.error('[context] Unexpected error:', error);
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
    const parsed = UpdateContextSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { scope, data } = parsed.data;

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

    const { data: context, error } = await supabase
      .from('business_memory')
      .upsert(
        {
          business_id: business.id,
          scope,
          data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'business_id,scope' }
      )
      .select()
      .single();

    if (error) {
      console.error('[context] Failed to update context:', error);
      return NextResponse.json(
        { error: 'Failed to update context' },
        { status: 500 }
      );
    }

    return NextResponse.json({ context }, { status: 200 });
  } catch (error) {
    console.error('[context] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
