import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAutomation } from '@/lib/core';

/**
 * POST /api/core/automation — Run automation rules.
 * All rules are deterministic (no AI). Can be called by cron or manually.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const results = await runAutomation(supabase, business.id);

    return NextResponse.json({
      results,
      executed: results.length,
      successful: results.filter(r => r.success).length,
    }, { status: 200 });
  } catch (error) {
    console.error('[api/core/automation] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
